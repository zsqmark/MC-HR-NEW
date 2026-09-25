import type { DataCollection } from '@wix/astro/builders';

type Field = DataCollection['fields'][number];

export const text = (key: string, displayName: string, encrypted = false): Field => ({
  key,
  displayName,
  type: 'TEXT',
  ...(encrypted ? { encrypted: true } : {}),
});

export const number = (key: string, displayName: string, encrypted = false): Field => ({
  key,
  displayName,
  type: 'NUMBER',
  ...(encrypted ? { encrypted: true } : {}),
});

export const boolean = (key: string, displayName: string): Field => ({
  key,
  displayName,
  type: 'BOOLEAN',
});

export const object = (key: string, displayName: string, encrypted = false): Field => ({
  key,
  displayName,
  type: 'OBJECT',
  objectOptions: { fields: [] },
  ...(encrypted ? { encrypted: true } : {}),
});

export const dateTime = (key: string, displayName: string): Field => ({
  key,
  displayName,
  type: 'DATETIME',
});

export const permissions = {
  itemInsert: 'PRIVILEGED',
  itemRead: 'PRIVILEGED',
  itemRemove: 'PRIVILEGED',
  itemUpdate: 'PRIVILEGED',
} as const;
