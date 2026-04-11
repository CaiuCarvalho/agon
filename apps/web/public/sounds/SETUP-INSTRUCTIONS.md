# Setup de Som de Notificação

## Arquivo Necessário

Você precisa adicionar um arquivo de som de notificação:

```
apps/web/public/sounds/notification.mp3
```

## Como Obter um Som de Notificação

### Opção 1: Sites de Sons Gratuitos

1. **Freesound.org** (https://freesound.org/)
   - Busque por: "notification bell", "success chime", "order alert"
   - Filtro: Creative Commons 0 (domínio público)
   - Download em MP3

2. **Zapsplat** (https://www.zapsplat.com/)
   - Categoria: UI Sounds → Notifications
   - Download gratuito com atribuição

3. **Notification Sounds** (https://notificationsounds.com/)
   - Sons específicos para notificações
   - Download direto em MP3

### Opção 2: Gerar com IA

Use ferramentas como:
- **ElevenLabs** (sound effects)
- **Soundraw** (AI music generator)
- **Mubert** (AI sound generator)

### Opção 3: Criar Manualmente

Use software de áudio como:
- **Audacity** (gratuito)
- **GarageBand** (Mac)
- **FL Studio** (Windows)

## Especificações Recomendadas

- **Formato**: MP3
- **Duração**: 1-2 segundos
- **Taxa de bits**: 128 kbps ou superior
- **Frequência**: 44.1 kHz
- **Tamanho**: < 100 KB
- **Volume**: Moderado (não muito alto)
- **Tom**: Agradável, não irritante

## Exemplos de Sons Adequados

1. **Bell Chime**: Som de sino suave
2. **Success Ding**: "Ding" curto e positivo
3. **Notification Pop**: Som de notificação moderna
4. **Gentle Alert**: Alerta suave e profissional

## Teste Rápido

Após adicionar o arquivo, teste no console do navegador:

```javascript
const audio = new Audio('/sounds/notification.mp3');
audio.volume = 0.5;
audio.play();
```

## Licenciamento

⚠️ **IMPORTANTE**: Certifique-se de que o som tem licença apropriada para uso comercial.

Licenças recomendadas:
- Creative Commons 0 (CC0) - Domínio público
- Creative Commons BY (CC BY) - Requer atribuição
- Royalty-free com licença comercial

## Fallback

Se não conseguir um som imediatamente, o sistema funcionará normalmente, apenas sem o alerta sonoro. As notificações toast e browser continuarão funcionando.

## Troubleshooting

### Som não reproduz

1. **Verifique o arquivo existe**:
   ```bash
   ls apps/web/public/sounds/notification.mp3
   ```

2. **Verifique o formato**:
   - Deve ser MP3 válido
   - Teste em um player de áudio

3. **Políticas de Autoplay**:
   - Alguns navegadores bloqueiam autoplay
   - Usuário precisa interagir com a página primeiro

4. **Permissões**:
   - Verifique se o arquivo tem permissões de leitura

### Som muito alto/baixo

Ajuste o volume no código:

```typescript
// Em apps/web/src/hooks/useSoundAlert.ts
audioRef.current.volume = 0.3; // Reduzir para 30%
// ou
audioRef.current.volume = 0.7; // Aumentar para 70%
```

## Recursos Adicionais

- [MDN: HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Autoplay Policy](https://developer.chrome.com/blog/autoplay/)

---

**Última Atualização**: 2025-01-XX
