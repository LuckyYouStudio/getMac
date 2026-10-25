"use client";

import { useTransition, type FormEvent } from "react";

/**
 * React 19 会在 <form action={...}> 提交后自动清空表单；校验失败时用户填的内容就全没了。
 * 用 onSubmit 手动派发同一个 action（经 useActionState 包装后的 dispatch），表单值得以保留。
 * 会带上点击的提交按钮（如 name="intent"）的值。
 */
export function useKeepValuesSubmit(dispatch: (fd: FormData) => void) {
  const [, startTransition] = useTransition();
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter);
    startTransition(() => dispatch(fd));
  };
}
