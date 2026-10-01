# Cuddly

App React Native/Expo para gravidez e pós-parto: contrações, amamentação, biberão, fraldas e consultas médicas — pensada para ser usada com uma mão, a meio da noite.

Proposta de projeto (plano de funcionalidades, moodboard, wireframes, calendário e orçamento): **[ver artefacto publicado](https://claude.ai/code/artifact/d48536bb-7e6f-44a8-8c6f-dd67d6c7458f)**. Wireframes de navegação/ecrãs: **[canvas publicado](https://claude.ai/code/artifact/65b38b77-ed41-465d-a66d-d7954bd5de70)**.

**Entrega: 18 de setembro de 2026.** Por causa do prazo curto, esta primeira versão cobre apenas quatro áreas de registo, offline, com um único perfil de bebé. Pumping, sono, sincronização entre cuidadores, estatísticas e exportação ficam documentados como trabalho a seguir à entrega.

## Stack

- [Expo](https://docs.expo.dev/) (SDK 57) + React Native + TypeScript
- [React Navigation](https://reactnavigation.org/) (bottom tabs)
- `@react-native-async-storage/async-storage` para persistência local
- `@expo-google-fonts/fredoka` + `@expo-google-fonts/karla` para a tipografia do moodboard

## Estrutura

```
App.tsx                     # carrega fontes, monta a navegação
src/
  theme/tokens.ts           # cores, espaçamento, tipografia — vindos do moodboard
  types/records.ts          # tipos partilhados (ContractionEntry, BottleEntry, ...)
  storage/storage.ts        # helpers de leitura/escrita no AsyncStorage
  utils/time.ts             # formatação de duração/hora
  components/               # Card, BigButton — usados em todos os ecrãs
  navigation/                # RootNavigator (bottom tabs) + tipos de rotas
  screens/HomeScreen.tsx     # painel inicial com atalhos e últimos registos
  features/
    contractions/           # cronómetro, deteção do padrão 5-1-1, histórico
    breastfeeding/           # cronómetro por lado, sugestão do próximo lado
    bottle/                  # registo de quantidade (ml) e tipo
    diapers/                 # registo rápido xixi/cocó/ambos
```

Cada área de registo vive na sua própria pasta em `src/features/`, com um hook (`useX.ts`) que trata da lógica/persistência e um `*Screen.tsx` que só desenha o ecrã — para permitir que membros diferentes da equipa trabalhem em áreas diferentes sem pisarem código uns dos outros.

## Correr o projeto

A app **já não corre no Expo Go**: usa módulos nativos (`expo-notifications`, `expo-file-system`, `expo-sharing`) que o Expo Go não inclui. É preciso um build nativo.

```bash
npm install
npm run android        # = npx expo run:android — compila, instala no emulador/telemóvel e arranca o Metro
```

Requisitos para o build local: Android Studio com um emulador (AVD) e o **JDK 17** (`JAVA_HOME` a apontar para ele — o JDK 25 que vem com o Android Studio falha no passo de CMake). Alternativa sem build local: um APK do EAS (`eas build --platform android --profile preview`).

Para a web: `npm run web`.

## Estado atual

O planeamento vive no [board do projeto](https://github.com/users/lmarques39/projects/3) e no milestone **v2 — entrega 31 out**.

## Trabalho futuro (depois da entrega)

Issues com a label `pós-v2` no board: publicação na Play Store, gráfico de percentis de crescimento (OMS), testes E2E com Maestro. Ideias ainda sem issue: múltiplos bebés/perfis, exportação PDF/CSV, modo noturno.

## Contribuir

Somos 4: Luís (Team/Mobile Lead), Sara (Backend/Data + QA Lead), Eliseu (UX/UI Lead), Beatriz (Docs Lead). Ver [`CONTRIBUTING.md`](CONTRIBUTING.md) para o fluxo de branches/PRs/reviews, [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md), [`SECURITY.md`](SECURITY.md) para reportar problemas de segurança, e [`LICENSE`](LICENSE) (MIT).
