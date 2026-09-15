# Testing setup — checklist (issue #6)

`npm run lint` e `npm run test` são só `echo` de momento — existem para o CI (`lint-typecheck-test`) não falhar, não testam nada a sério. Isto substitui isso.

## 1. Lint + format

- [x] Instalar `eslint`, `eslint-config-expo`, `prettier`, `eslint-config-prettier`
- [x] Config flat (`eslint.config.js`) a estender `expo` + `prettier` — **não** `.eslintrc.js` como aqui dizia, isso mudou no SDK 57 (ver PR #28)
- [x] `.prettierrc` com as convenções já usadas no código
- [x] `package.json` → `"lint": "expo lint"`
- [x] Corrido sobre o `src/` todo — sobraram 4 warnings pré-existentes (2x `set-state-in-effect`, 2x `import/no-duplicates` no firebase.ts), deixados como warning de propósito, ver comentário do PR #28

## 2. Unit / component tests

- [x] Instalar `jest-expo`, `@testing-library/react-native` (`@testing-library/jest-native` não foi preciso — RNTL 14 já inclui os matchers)
- [x] `package.json` → `"test": "jest"`, config `jest-expo` como preset
- [x] Primeiro teste a sério: `src/storage/storage.ts` (`storage.test.ts`)
- [x] Teste de componente: `src/features/contractions/ContractionsScreen.test.tsx` — render, toca em Iniciar/Parar, confirma a lista deixa de estar vazia. Mais um de hook: `useContractions.test.ts` (start/stop, deteção do padrão 5-1-1)
- [x] Mock do `src/services/firebase.ts` via `__mocks__/firebase/` (feito como parte da camada de sync, #57)

**Nota para quem escrever mais testes destes** (RNTL 14, ver commit desta issue): `render`, `renderHook` e o `act()` que envolve um `start()`/`stop()` de hook são todos **assíncronos** nesta versão — `await render(...)`, `await renderHook(...)`, `await act(async () => ...)`. Uma chamada `act()` síncrona não força o efeito que atualiza a ref do `renderHook` a correr, e os testes falham de forma confusa (`result` fica `null`/`undefined`) sem isso.

## 3. E2E smoke test (Maestro)

- [ ] Instalar a CLI do Maestro (`curl -Ls "https://get.maestro.mobile.dev" | bash`)
- [ ] Um fluxo `.yaml` mínimo em `.maestro/`: abrir a app → login → criar um registo de fralda → aparece no histórico
- [ ] Corre sobre um build real (APK do EAS ou emulador) — não sobre o Expo Go
- [ ] Documentar no README como correr localmente (`maestro test .maestro/smoke.yaml`)

Por fazer — precisa de um simulador/dispositivo real a correr (ver #20, Android Studio + AVD, ainda em Backlog) para gravar e validar o fluxo; não dá para fazer isto sem esse ambiente.

## 4. CI

- [x] Confirmado: o workflow `lint-typecheck-test` já corre `npm run lint`, `npm run typecheck` e `npm run test` a sério (deixaram de ser `echo` desde o PR #28)
- [ ] Maestro fica de fora do CI para já (precisa de build/emulador) — corre-se localmente antes de cada demo

## Ordem sugerida

1 (lint) → 2 (unit/component) → 3 (Maestro) → 4 (confirmar CI). Cada passo pode ser o seu próprio PR pequeno — mais fácil de rever do que um PR gigante.
