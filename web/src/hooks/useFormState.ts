import { useCallback, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';

export type FieldSetters<T> = { [K in keyof T]: (value: T[K]) => void };

export interface FormState<T> {
  values: T;
  /** Satu penyetel per bidang, identitasnya tetap selama komponen hidup. */
  setField: FieldSetters<T>;
  setValues: Dispatch<SetStateAction<T>>;
  reset: () => void;
}

/**
 * State formulir sebagai satu objek, plus penyetel per bidang.
 *
 * Formulir di panel ini punya sampai empat belas bidang. Sebagai `useState`
 * terpisah, mengosongkannya butuh empat belas baris yang mudah terlewat satu —
 * dan itulah sumber bug "formulir masih terisi data pemilih sebelumnya".
 * Dengan satu objek, `reset()` selalu mengosongkan semuanya.
 *
 * `awal` harus berupa objek tetap di tingkat modul: bentuknya dibaca sekali
 * untuk menyusun daftar penyetel, dan `reset()` mengembalikan nilai itu.
 */
export function useFormState<T extends Record<string, any>>(awal: T): FormState<T> {
  const [values, setValues] = useState<T>(awal);

  // Nilai awalnya dibekukan pada render pertama: dipakai untuk menyusun daftar
  // penyetel sekali saja, dan menjadi acuan `reset()` seterusnya.
  const awalRef = useRef(awal);

  // Disusun sekali supaya identitas tiap penyetel tetap: komponen formulir
  // menerimanya sebagai prop, dan penyetel baru tiap render akan membuat
  // seluruh formulir dirender ulang pada setiap ketikan di mana pun.
  const setField = useMemo(() => {
    const setters = {} as FieldSetters<T>;
    for (const key of Object.keys(awalRef.current) as Array<keyof T>) {
      setters[key] = (value) => setValues((prev) => ({ ...prev, [key]: value }));
    }
    return setters;
  }, []);

  const reset = useCallback(() => setValues(awalRef.current), []);

  return useMemo(() => ({ values, setField, setValues, reset }), [values, setField, reset]);
}
