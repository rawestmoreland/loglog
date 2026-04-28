import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '@/context/authContext';
import { usePocketBase } from '@/lib/pocketbaseConfig';

type ISignUp = {
  email: string;
  password: string;
  passwordConfirm: string;
  codeName: string;
};

export default function useSignUp() {
  const { pb } = usePocketBase();

  const signUpSchema = z
    .object({
      email: z.email(),
      password: z.string().min(8),
      passwordConfirm: z.string().min(8),
      codeName: z.string().min(1),
    })
    .superRefine((data, ctx) => {
      if (data.password !== data.passwordConfirm) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Passwords do not match',
          path: ['passwordConfirm'],
        });
      }
    });

  const {
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
  });
  const { signIn } = useAuth();

  async function signUp(form: ISignUp) {
    if (!pb) throw new Error('Pocketbase not initialized');

    try {
      await pb.collection('users').create({
        password: form.password,
        email: form.email,
        passwordConfirm: form.password,
        codeName: form.codeName,
      });
    } catch (err: any) {
      const pbData = err?.data?.data;
      if (pbData?.codeName?.code === 'validation_not_unique') {
        throw new Error('USERNAME_TAKEN');
      }
      throw err;
    }

    await signIn({ email: form.email, password: form.password });
    // poo_profile is created by the server-side OnRecordAfterCreateSuccess hook
    router.push('/(protected)');
  }

  return {
    signUp,
    handleSubmit,
    control,
    errors,
    setValue,
  };
}
