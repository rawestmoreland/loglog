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

    const existing = await pb
      .collection('poo_profiles')
      .getList(1, 1, { filter: `codeName = "${form.codeName}"` })
      .catch(() => ({ totalItems: 0 }));

    if (existing.totalItems > 0) {
      throw new Error('USERNAME_TAKEN');
    }

    try {
      const data = {
        password: form.password,
        email: form.email,
        passwordConfirm: form.password,
        codeName: form.codeName,
      };

      const user = await pb
        .collection('users')
        .create(data)
        .catch((e) =>
          console.error('Error creating user:', JSON.stringify(e, null, 2)),
        );
      const formData = {
        email: form.email,
        password: form.password,
      };
      console.log('User created successfully:', JSON.stringify(user, null, 2));
      await signIn(formData);

      await pb
        .collection('poo_profiles')
        .create({
          user,
          codeName: form.codeName,
        })
        .catch((e) =>
          console.error(
            'Error creating poo profile:',
            JSON.stringify(e, null, 2),
          ),
        );

      router.push('/(protected)');
    } catch (err: any) {
      // Check if PocketBase returned a unique constraint violation for codeName
      const pbData = err?.data?.data;
      if (pbData?.codeName?.code === 'validation_not_unique') {
        throw new Error('USERNAME_TAKEN');
      }
      throw err;
    }
  }

  return {
    signUp,
    handleSubmit,
    control,
    errors,
    setValue,
  };
}
