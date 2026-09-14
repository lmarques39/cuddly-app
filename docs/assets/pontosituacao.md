# Ponto de Situação — Cuddly

Objetivo de hoje: ter um **APK instalável a correr num Android real** para a demonstração.

## Já está pronto

- [x] Navegação de 4 separadores + design system
- [x] Contrações — cronómetro e alerta 5-1-1
- [x] Amamentação — cronómetro por lado
- [x] Biberão e Fraldas — registo rápido
- [x] Login/criação de conta (Firebase Auth)
- [x] Dataset sintético para demos e screenshots
- [x] Landing page publicada (GitHub Pages)

## Hoje, por pessoa

### Luís — Mobile Lead

- [x] Reduzir a #5 ao âmbito real (Auth)
- [x] Configurar `eas.json` e o pacote Android para o build
- [ ] Implementar "Esqueci-me da password" ([#5](https://github.com/lmarques39/cuddly-app/issues/5))
- [ ] Correr o EAS Build e obter o primeiro `.apk` de demo
- [ ] Rever e fazer merge das PRs [#26](https://github.com/lmarques39/cuddly-app/pull/26) e [#27](https://github.com/lmarques39/cuddly-app/pull/27)

### Sara — Backend/Data + QA Lead

- [ ] Terminar a PR [#28](https://github.com/lmarques39/cuddly-app/pull/28) — Jest + RNTL + ESLint (já em curso)
- [ ] Retomar o Android Studio + configurar o AVD ([#20](https://github.com/lmarques39/cuddly-app/issues/20))

*#3 e #4 (docs) em espera — falta localizar os ficheiros de referência da equipa.*

### Eliseu — UX/UI Lead

- [ ] Refinar os wireframes (em curso, hoje com a Beatriz)
- [ ] Checklist de acessibilidade nos ecrãs principais ([#17](https://github.com/lmarques39/cuddly-app/issues/17))

### Beatriz — Docs Lead

- [ ] Ajudar o Eliseu a refinar os wireframes hoje

*[#19](https://github.com/lmarques39/cuddly-app/issues/19) (Website simples do Cuddly) fica para outro dia — a Beatriz ainda não tem à-vontade a construir sites, faz mais sentido ganhar essa prática com mais tempo disponível, não a meio do sprint.*

## Para mostrar ao formador hoje

- `.apk` instalável, a correr num Android físico
- Fluxo completo: login → criar conta → registar bebé → trackers
- Histórico com os dados sintéticos (Sofia) para a demo