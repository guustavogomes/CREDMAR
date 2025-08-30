// Teste simples para verificar se a página de edição carrega
const puppeteer = require('puppeteer');

async function simpleTest() {
  console.log('🧪 Teste Simples - Verificando página de edição...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // Fazer login primeiro
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    
    await page.type('input[type="email"]', 'empresa1@teste.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    console.log('✅ Login realizado!');
    
    // Ir direto para uma página de edição
    console.log('📝 Acessando página de edição diretamente...');
    await page.goto('http://localhost:3000/dashboard/clientes/cmdz5ifao000714n3k7644yz9/editar');
    
    // Aguardar a página carregar
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Verificar se há elementos relacionados à foto
    const photoElements = await page.evaluate(() => {
      const elements = {
        photoSection: !!document.querySelector('.bg-gray-50.rounded-lg'),
        cameraIcon: !!document.querySelector('label[for="foto-upload"]'),
        uploadInput: !!document.querySelector('input[type="file"]#foto-upload'),
        userIcon: !!document.querySelector('svg'),
        formTitle: document.querySelector('h1')?.textContent || 'Não encontrado'
      };
      return elements;
    });
    
    console.log('📊 Elementos encontrados:');
    console.log('  - Seção de foto:', photoElements.photoSection ? '✅' : '❌');
    console.log('  - Ícone de câmera:', photoElements.cameraIcon ? '✅' : '❌');
    console.log('  - Input de upload:', photoElements.uploadInput ? '✅' : '❌');
    console.log('  - Ícones SVG:', photoElements.userIcon ? '✅' : '❌');
    console.log('  - Título da página:', photoElements.formTitle);
    
    // Aguardar para visualizar
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await browser.close();
  }
}

simpleTest().catch(console.error);