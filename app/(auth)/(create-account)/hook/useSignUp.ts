import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '~/context/authContext';
import { usePocketBase } from '~/lib/pocketbaseConfig';

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
      email: z.string().email(),
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
      const data = {
        password: form.password,
        email: form.email,
        passwordConfirm: form.password,
        codeName: form.codeName,
      };

      const user = await pb.collection('users').create(data);
      const formData = {
        email: form.email,
        password: form.password,
      };
      await signIn(formData);

      await pb.collection('poo_profiles').create({
        user,
        codeName: form.codeName,
      });

      router.push('/(protected)');
    } catch (err: any) {
      console.error(err.originalError);
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
