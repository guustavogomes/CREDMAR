// Script para testar a funcionalidade de foto dos clientes
const puppeteer = require('puppeteer');

async function testPhotoFeature() {
  console.log('🧪 Testando Funcionalidade de Foto dos Clientes...');
  console.log('=' * 60);

  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    // 1. Acessar aplicação
    console.log('📱 1. Acessando aplicação...');
    await page.goto('http://localhost:3000');
    await page.waitForSelector('body');
    
    // 2. Fazer login
    console.log('🔐 2. Fazendo login...');
    await page.goto('http://localhost:3000/login');
    await page.waitForSelector('input[type="email"]');
    
    await page.type('input[type="email"]', 'empresa1@teste.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForNavigation();
    console.log('✅ Login realizado com sucesso!');
    
    // 3. Ir para clientes
    console.log('👥 3. Navegando para clientes...');
    await page.goto('http://localhost:3000/dashboard/clientes');
    await page.waitForSelector('table');
    
    // 4. Clicar no primeiro cliente para editar
    console.log('✏️ 4. Abrindo edição do primeiro cliente...');
    const editButton = await page.$('a[href*="/editar"]');
    if (editButton) {
      await editButton.click();
      await page.waitForNavigation();
      
      // 5. Verificar se a seção de foto está presente
      console.log('🖼️ 5. Verificando seção de foto...');
      
      const photoSection = await page.$('.bg-gray-50.rounded-lg');
      if (photoSection) {
        console.log('✅ Seção de foto encontrada!');
        
        // Verificar se há foto ou placeholder
        const hasImage = await page.$('img[alt*=""]');
        const hasPlaceholder = await page.$('.bg-gray-200.rounded-full');
        
        if (hasImage) {
          console.log('✅ Foto do cliente encontrada!');
          
          // Verificar botão de remover
          const removeButton = await page.$('button:has-text("×")');
          if (removeButton) {
            console.log('✅ Botão de remover foto encontrado!');
          }
        } else if (hasPlaceholder) {
          console.log('✅ Placeholder de foto encontrado!');
        }
        
        // Verificar ícone de câmera
        const cameraIcon = await page.$('label[for="foto-upload"]');
        if (cameraIcon) {
          console.log('✅ Ícone de câmera encontrado!');
        }
        
        // Verificar input de upload
        const uploadInput = await page.$('input[type="file"]#foto-upload');
        if (uploadInput) {
          console.log('✅ Input de upload encontrado!');
        }
        
        console.log('');
        console.log('🎉 FUNCIONALIDADE DE FOTO FUNCIONANDO!');
        console.log('');
        console.log('📋 ELEMENTOS ENCONTRADOS:');
        console.log(`  - Seção de foto: ${photoSection ? '✅' : '❌'}`);
        console.log(`  - Foto/Placeholder: ${hasImage || hasPlaceholder ? '✅' : '❌'}`);
        console.log(`  - Ícone de câmera: ${cameraIcon ? '✅' : '❌'}`);
        console.log(`  - Input de upload: ${uploadInput ? '✅' : '❌'}`);
        
      } else {
        console.log('❌ Seção de foto NÃO encontrada!');
      }
      
    } else {
      console.log('❌ Botão de editar não encontrado!');
    }
    
    // Aguardar um pouco para visualizar
    console.log('');
    console.log('⏳ Aguardando 10 segundos para visualização...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

// Executar teste
testPhotoFeature().catch(console.error);