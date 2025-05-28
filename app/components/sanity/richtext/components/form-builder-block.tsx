'use client';
import { useFormspark } from '@formspark/use-formspark';
import React, { FC, useState } from 'react';
import { useForm } from 'react-hook-form';

const InputField = ({ type, id, fieldName, required, placeholder, register }) => (
  <div>
    <label htmlFor={id}>{fieldName}</label>
    <div>
      <input
        type={type}
        id={id}
        required={!!required}
        placeholder={placeholder}
        aria-describedby={type}
        {...register(id)}
      />
    </div>
  </div>
);

export const SanityForm = ({ formFields, uid }) => {
  const [submitted, setSubmitted] = useState(false);
  const [submit, submitting] = useFormspark({ formId: 'rM5ddiWWH' });
  const { register, handleSubmit } = useForm();

  const onSubmit = (data) => {
    submit(data);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div>
        <h1>Success box</h1>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {Array.isArray(formFields) &&
        formFields.map((field) => {
          const { inputType, _key, fieldId, placeholder, _type, fieldName, required } = field ?? {};
          const { current } = fieldId ?? {};
          if (!inputType || !current) return null;

          if (inputType === 'textArea') {
            return (
              <div key={_key}>
                <label htmlFor={current}>{fieldName}</label>
                <div>
                  <textarea
                    id={current}
                    required={!!required}
                    placeholder={placeholder}
                    aria-describedby="textarea"
                    {...register(current)}
                  />
                </div>
              </div>
            );
          }

          return (
            <InputField
              key={_key}
              type={inputType}
              id={current}
              fieldName={fieldName}
              required={required}
              placeholder={placeholder}
              register={register}
            />
          );
        })}
      <button type="submit" disabled={submitting}>
        Submit
      </button>
    </form>
  );
};