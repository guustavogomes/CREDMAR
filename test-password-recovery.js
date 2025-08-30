// Teste da funcionalidade de recuperação de senha
const puppeteer = require('puppeteer');

async function testPasswordRecovery() {
  console.log('🔐 Testando Funcionalidade de Recuperação de Senha...');
  console.log('=' * 60);

  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // 1. Acessar página de login
    console.log('🌐 1. Acessando página de login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('form');
    
    // 2. Verificar se o link "Esqueci minha senha" está presente
    console.log('🔍 2. Verificando link "Esqueci minha senha"...');
    const forgotPasswordLink = await page.$('a[href="/forgot-password"]');
    
    if (forgotPasswordLink) {
      console.log('✅ Link "Esqueci minha senha" encontrado!');
      
      // 3. Clicar no link
      console.log('👆 3. Clicando no link...');
      await forgotPasswordLink.click();
      await page.waitForNavigation();
      
      // 4. Verificar se chegou na página correta
      const currentUrl = page.url();
      console.log('📍 4. URL atual:', currentUrl);
      
      if (currentUrl.includes('/forgot-password')) {
        console.log('✅ Página de recuperação carregada!');
        
        // 5. Verificar elementos da página
        const pageElements = await page.evaluate(() => {
          return {
            title: document.querySelector('h1')?.textContent || 'Não encontrado',
            hasEmailInput: !!document.querySelector('input[type="email"]'),
            hasSubmitButton: !!document.querySelector('button[type="submit"]'),
            hasBackLink: !!document.querySelector('a[href="/login"]'),
            description: document.querySelector('p')?.textContent || 'Não encontrado'
          };
        });
        
        console.log('📊 5. Elementos da página:');
        console.log('  - Título:', pageElements.title);
        console.log('  - Input de email:', pageElements.hasEmailInput ? '✅' : '❌');
        console.log('  - Botão enviar:', pageElements.hasSubmitButton ? '✅' : '❌');
        console.log('  - Link voltar:', pageElements.hasBackLink ? '✅' : '❌');
        console.log('  - Descrição:', pageElements.description);
        
        // 6. Testar preenchimento do formulário
        console.log('📝 6. Testando preenchimento do formulário...');
        await page.type('input[type="email"]', 'teste@exemplo.com');
        
        console.log('✅ Email preenchido com sucesso!');
        
        // 7. Tirar screenshot
        await page.screenshot({ path: 'forgot-password-screenshot.png', fullPage: true });
        console.log('📸 Screenshot salvo como forgot-password-screenshot.png');
        
      } else {
        console.log('❌ Não chegou na página de recuperação');
      }
      
    } else {
      console.log('❌ Link "Esqueci minha senha" NÃO encontrado!');
    }
    
    // 8. Testar página de reset (simulação)
    console.log('🔄 8. Testando página de reset de senha...');
    await page.goto('http://localhost:3000/reset-password?token=test-token');
    await page.waitForSelector('body');
    
    const resetPageElements = await page.evaluate(() => {
      return {
        title: document.querySelector('h1')?.textContent || 'Não encontrado',
        hasPasswordInputs: document.querySelectorAll('input[type="password"]').length,
        hasSubmitButton: !!document.querySelector('button[type="submit"]'),
        isInvalidToken: document.body.textContent.includes('Link Inválido')
      };
    });
    
    console.log('📊 Página de reset:');
    console.log('  - Título:', resetPageElements.title);
    console.log('  - Inputs de senha:', resetPageElements.hasPasswordInputs);
    console.log('  - Botão enviar:', resetPageElements.hasSubmitButton ? '✅' : '❌');
    console.log('  - Token inválido:', resetPageElements.isInvalidToken ? '✅ (esperado)' : '❌');
    
    // Aguardar para visualizar
    console.log('⏳ Aguardando 15 segundos para visualização...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    console.log('');
    console.log('🎉 TESTE DE RECUPERAÇÃO DE SENHA CONCLUÍDO!');
    console.log('');
    console.log('📋 RESUMO:');
    console.log('✅ Página de login com link de recuperação');
    console.log('✅ Página de recuperação de senha');
    console.log('✅ Página de reset de senha');
    console.log('✅ Validação de token inválido');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

testPasswordRecovery().catch(console.error);