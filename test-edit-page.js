// Teste específico para a página de edição
const puppeteer = require('puppeteer');

async function testEditPage() {
  console.log('🧪 Testando Página de Edição de Cliente...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Login
    console.log('🔐 Fazendo login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    
    await page.type('input[type="email"]', 'empresa1@teste.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    // Ir direto para página de edição
    console.log('📝 Acessando página de edição...');
    await page.goto('http://localhost:3000/dashboard/clientes/cmdz5ifao000714n3k7644yz9/editar');
    
    // Aguardar carregamento
    await page.waitForSelector('form', { timeout: 15000 });
    
    // Aguardar um pouco mais para garantir que tudo carregou
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar elementos na página
    const pageContent = await page.evaluate(() => {
      return {
        title: document.querySelector('h1')?.textContent || 'Não encontrado',
        hasForm: !!document.querySelector('form'),
        hasCpfInput: !!document.querySelector('input[id="cpf"]'),
        hasPhotoSection: !!document.querySelector('.bg-gray-50.rounded-lg'),
        hasCameraIcon: !!document.querySelector('label[for="foto-upload"]'),
        hasUploadInput: !!document.querySelector('input[type="file"]#foto-upload'),
        hasUserIcon: !!document.querySelector('svg'),
        allDivs: document.querySelectorAll('div').length,
        bodyHTML: document.body.innerHTML.includes('Seção da Foto') ? 'Tem seção de foto' : 'Não tem seção de foto'
      };
    });
    
    console.log('📊 Análise da página:');
    console.log('  - Título:', pageContent.title);
    console.log('  - Tem formulário:', pageContent.hasForm ? '✅' : '❌');
    console.log('  - Tem input CPF:', pageContent.hasCpfInput ? '✅' : '❌');
    console.log('  - Tem seção de foto:', pageContent.hasPhotoSection ? '✅' : '❌');
    console.log('  - Tem ícone de câmera:', pageContent.hasCameraIcon ? '✅' : '❌');
    console.log('  - Tem input de upload:', pageContent.hasUploadInput ? '✅' : '❌');
    console.log('  - Total de divs:', pageContent.allDivs);
    console.log('  - HTML contém seção:', pageContent.bodyHTML);
    
    // Tirar screenshot
    await page.screenshot({ path: 'edit-page-screenshot.png', fullPage: true });
    console.log('📸 Screenshot salvo como edit-page-screenshot.png');
    
    // Aguardar para visualizar
    console.log('⏳ Aguardando 15 segundos para visualização...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
  }
}

testEditPage().catch(console.error);