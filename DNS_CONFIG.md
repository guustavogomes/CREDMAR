# Configuração DNS para organizaemprestimos.com.br

## Configurações necessárias no seu provedor de domínio

### Para apontar para a Vercel:

**Registro CNAME:**
- **Tipo**: CNAME
- **Nome**: @ (ou deixe vazio para o domínio raiz)
- **Valor**: `cname.vercel-dns.com`
- **TTL**: 3600 (ou o padrão do provedor)

### Alternativa com registro A (se CNAME não funcionar):

**Registro A:**
- **Tipo**: A
- **Nome**: @ (ou deixe vazio)
- **Valor**: `76.76.19.61` (IP da Vercel - pode mudar)
- **TTL**: 3600

**Registro CNAME para www:**
- **Tipo**: CNAME
- **Nome**: www
- **Valor**: `organizaemprestimos.com.br`
- **TTL**: 3600

## Verificação

Após configurar o DNS, você pode verificar se está funcionando:

```bash
# Verificar DNS
nslookup organizaemprestimos.com.br

# Ou usar dig (Linux/Mac)
dig organizaemprestimos.com.br

# Verificar online
# https://dnschecker.org/
```

## Tempo de Propagação

- **Mínimo**: 15 minutos
- **Máximo**: 48 horas
- **Típico**: 2-6 horas

## Troubleshooting

### Se o domínio não funcionar:

1. **Verifique na Vercel**:
   - Vá em Settings > Domains
   - Certifique-se de que o domínio está listado
   - Verifique se há erros de configuração

2. **Verifique o DNS**:
   - Use ferramentas online como dnschecker.org
   - Confirme se o CNAME está apontando corretamente

3. **Certificado SSL**:
   - A Vercel gera automaticamente
   - Pode levar alguns minutos após o DNS estar correto

4. **Cache do navegador**:
   - Limpe o cache ou use modo incógnito
   - Teste em diferentes dispositivos/redes

## Contato do Suporte

Se tiver problemas:
- **Vercel**: https://vercel.com/support
- **Provedor de domínio**: Consulte a documentação específica do seu provedor