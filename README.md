# FORMA — Sistema de gestión de gimnasio

Aplicación web basada en el prototipo Figma compartido, desarrollada con React, Vite y TypeScript. Incluye un panel administrativo con resumen, socios, membresías, pagos, clases, entrenadores, mantenimiento, finanzas y reportes.

## Requisitos

- Node.js 20.19 o posterior
- npm
- Un proyecto de Supabase para usar datos persistentes

## Desarrollo local

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Completa `.env.local` con la URL y la clave pública (`anon` o `publishable`) de tu proyecto Supabase. No uses una `service_role` key en el navegador.

En Supabase, ejecuta `supabase/schema.sql` desde el SQL Editor. El esquema contiene perfiles y roles, socios, planes, pagos, clases y reservas, entrenadores, mantenimiento, gastos e informes. La aplicación puede arrancar sin credenciales para revisar la interfaz de demostración.

El acceso usa Supabase Auth. Al crear la cuenta se genera un perfil; el usuario se vincula a un socio por correo si coincide. El acceso de personal se asigna desde el módulo **Personal**, después de iniciar sesión con una cuenta que tenga rol `owner`. Los permisos de interfaz se respaldan con políticas RLS en la base de datos.

Para poblar Supabase, ejecuta `supabase/seed.sql` después del esquema. Luego crea una cuenta en la pantalla de acceso y asígnale el rol inicial `owner` desde el SQL Editor:

Las políticas RLS limitan cada tabla al rol correspondiente. Para asignar el primer rol `owner`, ejecuta el SQL de bootstrap de arriba desde el SQL Editor; después podrás gestionar el personal en la aplicación.

## Producción

Configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en el proveedor de hosting antes de compilar. También se acepta `VITE_SUPABASE_ANON_KEY`. El proyecto está preparado para publicarse como sitio estático de Vite.

## Privacidad de datos

El SQL activa Row Level Security y limita las operaciones a usuarios autenticados. Antes de guardar información real, configura Supabase Auth y ajusta las políticas al modelo de roles y permisos de tu gimnasio.
