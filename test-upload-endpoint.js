// Teste do sistema de upload de comprovante
const fs = require('fs');
const path = require('path');

async function testUploadSystem() {
  console.log('📤 Testando sistema de upload de comprovante...');

  try {
    // Verificar se o diretório de uploads existe e tem permissões
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'proofs');
    
    try {
      const stats = fs.statSync(uploadDir);
      console.log('✅ Diretório de uploads existe:', uploadDir);
      console.log('📁 Permissões:', stats.mode.toString(8));
    } catch (error) {
      console.log('❌ Problema com diretório de uploads:', error.message);
      return;
    }

    // Listar arquivos existentes
    try {
      const files = fs.readdirSync(uploadDir);
      console.log(`📂 Arquivos no diretório: ${files.length}`);
      files.forEach(file => {
        if (file !== '.gitkeep') {
          const filePath = path.join(uploadDir, file);
          const stats = fs.statSync(filePath);
          console.log(`   - ${file} (${stats.size} bytes, ${stats.mtime.toLocaleDateString()})`);
        }
      });
    } catch (error) {
      console.log('❌ Erro ao listar arquivos:', error.message);
    }

    // Criar uma imagem de teste para verificar se conseguimos escrever
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x5D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const testFileName = `test-${Date.now()}.png`;
    const testFilePath = path.join(uploadDir, testFileName);

    try {
      fs.writeFileSync(testFilePath, testImageBuffer);
      console.log('✅ Teste de escrita bem-sucedido');
      
      // Verificar se o arquivo foi criado
      const stats = fs.statSync(testFilePath);
      console.log(`📄 Arquivo criado: ${testFileName} (${stats.size} bytes)`);
      
      // Limpar arquivo de teste
      fs.unlinkSync(testFilePath);
      console.log('🧹 Arquivo de teste removido');
      
    } catch (error) {
      console.log('❌ Erro ao escrever arquivo de teste:', error.message);
    }

    console.log('\n💡 Para testar o upload completo:');
    console.log('1. Inicie o servidor: npm run dev');
    console.log('2. Faça login como: guustavogomes@gmail.com');
    console.log('3. Acesse: http://localhost:3000/pending-payment');
    console.log('4. Envie um comprovante de imagem');
    console.log('5. Verifique se aparece na lista de comprovantes pendentes');

    console.log('\n🔧 Endpoint corrigido:');
    console.log('- /api/payment/upload-proof agora processa arquivos reais');
    console.log('- Validação de tipo (JPG, PNG, WebP)');
    console.log('- Validação de tamanho (máx 5MB)');
    console.log('- Salva em /public/uploads/proofs/');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar
testUploadSystem().catch(console.error);