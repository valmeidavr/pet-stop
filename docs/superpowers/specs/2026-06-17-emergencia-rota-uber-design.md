# /emergencia estilo Uber — rota real, posição ao vivo e re-rota

**Data:** 2026-06-17
**Status:** Aprovado (aguardando revisão do spec)

## Objetivo

Transformar `/emergencia` numa experiência "estilo Uber" para o tutor que
dirige até a clínica/hospital mais próximo: em vez da **linha reta** atual,
desenhar a **rota real pelas ruas**, com distância por estrada e tempo estimado
de carro, posição ao vivo e re-rota automática.

## Cenário

O tutor é quem dirige até a clínica. Não há motorista despachado nem backend de
despacho. O mapa mostra o caminho da posição atual do usuário até o destino.

## Estado atual

- `PetMap` (modo `emergencyMode`) pega a posição via `getCurrentPosition`
  (one-shot), escolhe a unidade mais próxima por **distância em linha reta** e
  desenha um `Polyline` reto `[userPos, destino]`.
- Há um botão "Abrir GPS no Google Maps" (handoff externo).

## Decisões tomadas

- **Roteamento:** OSRM público (`router.project-osrm.org`), grátis e sem chave.
- **Nível:** rota real + posição ao vivo + re-rota automática (pacote completo).
- **Fallback:** se o OSRM falhar, voltar para a linha reta atual + aviso discreto.
- **Recentralizar** o mapa automaticamente conforme o usuário se move: sim.

## Arquitetura (mantendo o PetMap enxuto)

`PetMap.tsx` já tem ~522 linhas; a lógica de rota fica em módulos separados.

1. `src/lib/routing/osrm.ts` (puro, sem React, testável)
   - `fetchDrivingRoute(origin, dest, signal?)` →
     `/route/v1/driving/...?overview=full&geometries=geojson`, retorna
     `{ coordinates: [lat,lng][], distanceM, durationS }`.
   - `parseOsrmResponse(json)` separado para testar o parsing.
   - `shouldRefetchRoute(lastPos, currentPos, route, thresholds)` → decisão pura:
     refaz se moveu > ~120 m **e** está > ~50 m fora da linha da rota
     (distância ponto→polyline). Como sempre roteia de onde o usuário está agora
     até o destino, a re-rota sai de graça desse mesmo mecanismo.

2. `src/components/useDrivingRoute.ts` (hook)
   - Recebe `origin` (posição ao vivo) e `destination`; gerencia
     `route / loading / error`; refaz a chamada (throttle mín. ~10 s +
     `AbortController`) quando `shouldRefetchRoute` indicar.

3. `PetMap.tsx` (view)
   - No modo emergência, troca `getCurrentPosition` por `watchPosition`
     (mantém o one-shot fora da emergência).
   - Substitui o `routeLine` reto pela polyline do OSRM (laranja `#ea580c`).
   - Banner mostra unidade mais próxima + **~X km por estrada · ~Y min de carro**.
   - Recentraliza o mapa quando a posição muda de forma significativa.

## Seleção do destino

Mantém a escolha do mais próximo por **linha reta** (barato, já existe) e roteia
só para esse. Evolução futura possível: OSRM `table` para escolher por tempo de
carro.

## Tratamento de erro

- Falha de roteamento → fallback para a linha reta + aviso ("Não foi possível
  traçar a rota pelas ruas; mostrando linha direta").
- O botão "Abrir GPS no Google Maps" continua sempre disponível como saída
  confiável.
- `AbortController` + throttle (mín. ~10 s entre recálculos) para não estourar o
  demo público do OSRM.

## Testes (vitest)

- `parseOsrmResponse`: resposta OK, sem rota, malformada.
- `shouldRefetchRoute`: moveu pouco → não; saiu da rota → sim.
- Distância ponto→polyline.

## Fora de escopo (MVP)

- Turn-by-turn dentro do app (fica com o handoff para o Google Maps).
- Escolha do destino por tempo de carro (OSRM `table`).
