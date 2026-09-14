# Testing setup — checklist (issue #6)

`npm run lint` e `npm run test` são só `echo` de momento — existem para o CI (`lint-typecheck-test`) não falhar, não testam nada a sério. Isto substitui isso.

## 1. Lint + format

- [ ] Instalar `eslint`, `eslint-config-expo`, `prettier`, `eslint-config-prettier`
- [ ] `.eslintrc.js` a estender `expo` + `prettier` (evita conflitos entre os dois)
- [ ] `.prettierrc` com as convenções já usadas no código (aspas simples, ponto e vírgula — ver ficheiros existentes em `src/`)
- [ ] `package.json` → `"lint": "eslint . --ext .ts,.tsx"`
- [ ] Correr uma vez sobre o `src/` todo e corrigir o que aparecer (`--fix` primeiro, o resto à mão)

## 2. Unit / component tests

- [ ] Instalar `jest-expo`, `@testing-library/react-native`, `@testing-library/jest-native`
- [ ] `package.json` → `"test": "jest"`, config `jest-expo` como preset
- [ ] Primeiro teste a sério, para validar que a config funciona: `src/storage/storage.ts` (`loadList`/`saveList`/`addToList` — puro, sem UI, fácil de testar)
- [ ] Depois: um teste de componente para um ecrã simples (ex. `ContractionsScreen` ou `DiapersScreen`) com `@testing-library/react-native` — render + simular um toque + verificar o resultado
- [ ] Mock do `src/services/firebase.ts` (não queremos testes unitários a bater no Firebase real)

## 3. E2E smoke test (Maestro)

- [ ] Instalar a CLI do Maestro (`curl -Ls "https://get.maestro.mobile.dev" | bash`)
- [ ] Um fluxo `.yaml` mínimo em `.maestro/`: abrir a app → login → criar um registo de fralda → aparece no histórico
- [ ] Corre sobre um build real (APK do EAS ou emulador) — não sobre o Expo Go
- [ ] Documentar no README como correr localmente (`maestro test .maestro/smoke.yaml`)

## 4. CI

- [ ] Confirmar que o workflow `lint-typecheck-test` (`.github/workflows/`) já corre `npm run lint` e `npm run test` de verdade depois disto (hoje passa só porque são `echo`)
- [ ] Maestro fica de fora do CI para já (precisa de build/emulador) — corre-se localmente antes de cada demo

## Ordem sugerida

1 (lint) → 2 (unit/component) → 3 (Maestro) → 4 (confirmar CI). Cada passo pode ser o seu próprio PR pequeno — mais fácil de rever do que um PR gigante.
