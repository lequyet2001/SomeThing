import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { LogIn, UserPlus } from "lucide-react";

import { FieldError } from "../components/forms/FieldError";
import {
  customerPanelClass,
  customerPrimaryButtonClass,
  customerSecondaryButtonClass,
} from "../components/customer/CustomerSurface";
import { useLanguage } from "../i18n/LanguageContext";
import type { AuthFormValues, AuthMode } from "../types/shop";
import { getAriaInvalid } from "../utils/a11y";
import { createAuthSchema } from "../utils/validationSchemas";
import ButtonLiquid from "../components/ButtonLiquid";
import { Link } from "react-router-dom";

function AuthPage({
  mode,
  onNavigate,
  onSubmit,
}: {
  mode: AuthMode;
  onNavigate: (mode: AuthMode) => void;
  onSubmit: (values: AuthFormValues, mode: AuthMode) => Promise<unknown>;
}) {
  const { t } = useLanguage();
  const isRegister = mode === "register";
  const schema = useMemo(() => createAuthSchema(t, mode), [mode, t]);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
  });

  useEffect(() => {
    reset({ email: "", name: "", password: "" });
  }, [mode, reset]);

  function handleValidatedSubmit(values: AuthFormValues) {
    return onSubmit(values, mode);
  }

  return (
    <section className="mx-auto grid min-h-[60vh] max-w-md place-items-center">
      <form
        className={`${customerPanelClass} grid w-full gap-4`}
        noValidate
        onSubmit={handleSubmit(handleValidatedSubmit)}
      >
        <div className="grid gap-2">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primaryDark">
            {isRegister ? <UserPlus size={15} /> : <LogIn size={15} />}
            {isRegister ? t("auth.createAccount") : t("auth.login")}
          </p>
          <h1>{isRegister ? t("auth.register") : t("auth.login")}</h1>
        </div>
        {isRegister && (
          <label>
            {t("auth.name")}
            <input
              {...register("name")}
              aria-invalid={getAriaInvalid(errors.name)}
              autoComplete="name"
            />
            <FieldError error={errors.name} />
          </label>
        )}
        <label>
          {t("auth.email")}
          <input
            {...register("email")}
            aria-invalid={getAriaInvalid(errors.email)}
            autoComplete="email"
            type="email"
          />
          <FieldError error={errors.email} />
        </label>
        <label>
          {t("auth.password")}
          <input
            {...register("password")}
            aria-invalid={getAriaInvalid(errors.password)}
            autoComplete={isRegister ? "new-password" : "current-password"}
            type="password"
          />
          <FieldError error={errors.password} />
        </label>
        <button className={customerPrimaryButtonClass} disabled={isSubmitting}>
          {isRegister ? t('auth.createAccount') : t('auth.login')}
        </button>
       {/* <ButtonLiquid  isSubmitting={isSubmitting}  t={isRegister ? t('auth.createAccount') : t('auth.login')} /> */}

        {!isRegister && (
          <Link className={customerSecondaryButtonClass} to="/forgot-password">
            {t("auth.forgotPassword")}
          </Link>
  
        )}
        <button
          type="button"
          className={customerSecondaryButtonClass}
          onClick={() => onNavigate(isRegister ? "login" : "register")}
        >
          {isRegister ? t("auth.hasAccount") : t("auth.noAccount")}
        </button>
        {/* <ButtonLiquid isSubmitting={isSubmitting}  t={isRegister ? t('auth.hasAccount') : t('auth.noAccount')} onClick={() => onNavigate(isRegister ? "login" : "register")} /> */}
      </form>
    </section>
  );
}

export default AuthPage;
