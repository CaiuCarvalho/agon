# 🚀 CONFIGURAR PM2 PARA INICIAR AUTOMATICAMENTE

## Por que isso é importante?

Se o servidor reiniciar (manutenção, atualização, queda de energia), o PM2 vai iniciar automaticamente a aplicação sem intervenção manual.

---

## 📋 PASSO A PASSO

### 1. Execute o comando de startup

```bash
pm2 startup
```

### 2. Copie e execute o comando que aparecer

O PM2 vai mostrar algo como:

```bash
[PM2] You have to run this command as root. Execute the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

**Copie e execute esse comando exatamente como mostrado.**

### 3. Salve a configuração atual

```bash
pm2 save
```

Isso salva a lista atual de processos (agon-web) para ser restaurada no boot.

---

## ✅ VERIFICAR SE FUNCIONOU

### Teste 1: Ver o serviço systemd

```bash
systemctl status pm2-root
```

Deve mostrar:
```
● pm2-root.service - PM2 process manager
   Loaded: loaded (/etc/systemd/system/pm2-root.service; enabled; vendor preset: enabled)
   Active: active (running)
```

### Teste 2: Simular reinicialização (OPCIONAL - CUIDADO!)

```bash
# ATENÇÃO: Isso vai reiniciar o servidor!
# Só faça se tiver certeza e acesso físico/console ao servidor
sudo reboot
```

Após reiniciar, verifique:
```bash
pm2 status
```

Deve mostrar `agon-web` rodando automaticamente.

---

## 🔧 COMANDOS ÚTEIS

```bash
# Ver status do serviço PM2
systemctl status pm2-root

# Parar o serviço PM2 (não recomendado)
sudo systemctl stop pm2-root

# Iniciar o serviço PM2
sudo systemctl start pm2-root

# Reiniciar o serviço PM2
sudo systemctl restart pm2-root

# Desabilitar startup automático (se necessário)
pm2 unstartup
```

---

## 📝 O QUE FOI CONFIGURADO

1. ✅ Serviço systemd criado: `/etc/systemd/system/pm2-root.service`
2. ✅ Serviço habilitado para iniciar no boot
3. ✅ Lista de processos salva em: `/root/.pm2/dump.pm2`
4. ✅ PM2 vai restaurar `agon-web` automaticamente após reinicialização

---

## ⚠️ IMPORTANTE

- O comando `pm2 save` deve ser executado sempre que você adicionar/remover processos
- Se você atualizar a aplicação, não precisa executar `pm2 save` novamente
- O serviço systemd vai iniciar o PM2, e o PM2 vai iniciar o `agon-web`

---

## 🎯 RESULTADO ESPERADO

Após configurar:
- ✅ Servidor reinicia → PM2 inicia automaticamente
- ✅ PM2 inicia → `agon-web` inicia automaticamente
- ✅ Aplicação fica disponível sem intervenção manual

---

**Execute os comandos acima na VPS e me confirme quando terminar!**
