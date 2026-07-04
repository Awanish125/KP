"use client";

/**
 * ContactForm — controlled form built from the JSON field schema.
 * Validation is hand-rolled (no library deps): required, email, phone.
 * Errors announce via role="alert"; success replaces the form.
 */

import { useState } from "react";
import { CONTACT_FORM_DEFAULTS, EMAIL_RE, PHONE_RE } from "./contactFormConfig";
import type { ContactField, ContactFormProps } from "./contactFormTypes";

function validateField(field: ContactField, value: string): string | null {
  const v = value.trim();
  if (field.required && !v) return `${field.label} is required.`;
  if (!v) return null;
  if (field.type === "email" && !EMAIL_RE.test(v)) return "Enter a valid email address.";
  if (field.type === "tel" && !PHONE_RE.test(v)) return "Enter a valid phone number.";
  return null;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.85rem 1.1rem",
  borderRadius: "0.75rem",
  background: "var(--bg)",
  border: "1px solid var(--border-strong)",
  color: "var(--text)",
  fontFamily: "var(--kp-font-body)",
  fontSize: "0.95rem",
  outline: "none",
  transition: "border-color 200ms ease, box-shadow 200ms ease",
};

export function ContactForm({
  className,
  onSubmit,
  fields = CONTACT_FORM_DEFAULTS.fields,
  submitLabel = CONTACT_FORM_DEFAULTS.submitLabel,
  successMessage = CONTACT_FORM_DEFAULTS.successMessage,
}: ContactFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  const setValue = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Clear the error as soon as the user starts fixing it.
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const handleBlur = (field: ContactField) => {
    const err = validateField(field, values[field.name] ?? "");
    if (err) setErrors((prev) => ({ ...prev, [field.name]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      const err = validateField(field, values[field.name] ?? "");
      if (err) nextErrors[field.name] = err;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setStatus("submitting");
    try {
      await onSubmit?.(values);
      setStatus("done");
    } catch {
      setStatus("idle");
      setErrors({ _form: "Something went wrong — please try again." });
    }
  };

  if (status === "done") {
    return (
      <div
        className={className}
        role="status"
        style={{
          padding: "2.5rem",
          borderRadius: "1rem",
          background: "var(--surface)",
          border: "1px solid var(--kp-orange-glow)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--kp-font-display)",
            fontSize: "1.6rem",
            textTransform: "uppercase",
            color: "var(--kp-orange)",
          }}
        >
          Enquiry sent
        </div>
        <p
          className="mt-3"
          style={{
            fontFamily: "var(--kp-font-body)",
            color: "var(--text-muted)",
            lineHeight: 1.7,
          }}
        >
          {successMessage}
        </p>
      </div>
    );
  }

  return (
    <form className={className} onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const isWide = field.type === "textarea" || field.type === "select";
          const err = errors[field.name];
          const id = `contact-${field.name}`;

          const common = {
            id,
            name: field.name,
            value: values[field.name] ?? "",
            required: field.required,
            "aria-invalid": !!err,
            "aria-describedby": err ? `${id}-error` : undefined,
            onBlur: () => handleBlur(field),
            style: {
              ...inputStyle,
              borderColor: err ? "var(--kp-orange)" : "var(--border-strong)",
            },
          };

          return (
            <div key={field.name} className={isWide ? "sm:col-span-2" : undefined}>
              <label
                htmlFor={id}
                style={{
                  display: "block",
                  fontFamily: "var(--kp-font-mono)",
                  fontSize: "0.7rem",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: "0.5rem",
                }}
              >
                {field.label}
                {field.required && <span style={{ color: "var(--kp-orange)" }}> *</span>}
              </label>

              {field.type === "textarea" ? (
                <textarea
                  {...common}
                  rows={5}
                  placeholder={field.placeholder}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  style={{ ...common.style, resize: "vertical" }}
                />
              ) : field.type === "select" ? (
                <select
                  {...common}
                  onChange={(e) => setValue(field.name, e.target.value)}
                >
                  <option value="" disabled>
                    Select…
                  </option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  {...common}
                  type={field.type}
                  placeholder={field.placeholder}
                  onChange={(e) => setValue(field.name, e.target.value)}
                />
              )}

              {err && (
                <p
                  id={`${id}-error`}
                  role="alert"
                  style={{
                    marginTop: "0.4rem",
                    fontFamily: "var(--kp-font-body)",
                    fontSize: "0.8rem",
                    color: "var(--kp-orange)",
                  }}
                >
                  {err}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {errors._form && (
        <p role="alert" style={{ marginTop: "1rem", color: "var(--kp-orange)", fontFamily: "var(--kp-font-body)" }}>
          {errors._form}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-8 w-full rounded-full py-4 transition-transform duration-200 hover:scale-[1.02] disabled:opacity-60 sm:w-auto sm:px-12"
        style={{
          background: "var(--kp-orange)",
          color: "var(--kp-dark)",
          fontFamily: "var(--kp-font-body)",
          fontWeight: 700,
          fontSize: "1rem",
          border: "none",
          cursor: status === "submitting" ? "wait" : "pointer",
          boxShadow: "0 8px 32px var(--kp-orange-glow)",
        }}
      >
        {status === "submitting" ? "Sending…" : submitLabel}
      </button>
    </form>
  );
}
