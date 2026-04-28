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

type SignUpFieldKey = 'email' | 'password' | 'passwordConfirm';

export class SignUpValidationError extends Error {
  fields: Partial<Record<SignUpFieldKey, string>>;
  constructor(fields: Partial<Record<SignUpFieldKey, string>>) {
    super('SIGNUP_VALIDATION');
    this.fields = fields;
  }
}

const PB_FIELD_MESSAGES: Record<string, Record<string, string>> = {
  email: {
    validation_not_unique: 'An account with this email already exists',
    validation_invalid_email: 'Enter a valid email address',
    validation_required: 'Email is required',
  },
  password: {
    validation_min_text_constraint: 'Password must be at least 8 characters',
    validation_required: 'Password is required',
  },
  passwordConfirm: {
    validation_values_mismatch: 'Passwords do not match',
    validation_required: 'Please confirm your password',
  },
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
        passwordConfirm: form.passwordConfirm,
        codeName: form.codeName,
      });
    } catch (err: any) {
      const pbData = err?.data?.data;

      if (pbData?.codeName?.code === 'validation_not_unique') {
        throw new Error('USERNAME_TAKEN');
      }

      const fieldErrors: Partial<Record<SignUpFieldKey, string>> = {};
      for (const field of ['email', 'password', 'passwordConfirm'] as const) {
        const code = pbData?.[field]?.code;
        if (code) {
          fieldErrors[field] =
            PB_FIELD_MESSAGES[field]?.[code] ?? pbData[field].message ?? `Invalid ${field}`;
        }
      }
      if (Object.keys(fieldErrors).length > 0) {
        throw new SignUpValidationError(fieldErrors);
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
