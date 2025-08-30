// Criar uma imagem de teste real para o comprovante
const fs = require('fs');
const path = require('path');

function createTestImage() {
  console.log('🖼️ Criando imagem de teste para comprovante...');

  try {
    // Criar uma imagem PNG simples (1x1 pixel transparente)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
      0x00, 0x00, 0x00, 0x64, // width: 100px
      0x00, 0x00, 0x00, 0x64, // height: 100px
      0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
      0x70, 0x81, 0xA4, 0x54, // CRC
      0x00, 0x00, 0x00, 0x0D, // IDAT chunk length
      0x49, 0x44, 0x41, 0x54, // IDAT
      0x78, 0x9C, 0x62, 0x00, 0x02, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, // compressed data
      0x00, 0x00, 0x00, 0x00, // IEND chunk length
      0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82  // CRC
    ]);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'proofs');
    const imagePath = path.join(uploadDir, 'test-comprovante-email.jpg');

    // Verificar se o diretório existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('📁 Diretório criado:', uploadDir);
    }

    // Criar uma imagem mais realista (simulando um comprovante)
    const svgContent = `
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect width="400" height="300" fill="#f8f9fa" stroke="#dee2e6" stroke-width="2"/>
  
  <!-- Header -->
  <rect x="0" y="0" width="400" height="60" fill="#007bff"/>
  <text x="200" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="bold">COMPROVANTE PIX</text>
  
  <!-- Content -->
  <text x="20" y="90" fill="#333" font-family="Arial" font-size="14" font-weight="bold">Banco: Banco Teste</text>
  <text x="20" y="110" fill="#666" font-family="Arial" font-size="12">Agência: 1234-5</text>
  <text x="20" y="130" fill="#666" font-family="Arial" font-size="12">Conta: 12345-6</text>
  
  <text x="20" y="160" fill="#333" font-family="Arial" font-size="14" font-weight="bold">Valor: R$ 100,00</text>
  <text x="20" y="180" fill="#666" font-family="Arial" font-size="12">Data: 23/08/2025</text>
  <text x="20" y="200" fill="#666" font-family="Arial" font-size="12">Hora: 10:30:45</text>
  
  <text x="20" y="230" fill="#333" font-family="Arial" font-size="14" font-weight="bold">Destinatário: TaPago</text>
  <text x="20" y="250" fill="#666" font-family="Arial" font-size="12">Chave PIX: organizaemprestimos@gmail.com</text>
  
  <!-- Footer -->
  <rect x="20" y="270" width="360" height="20" fill="#28a745"/>
  <text x="200" y="283" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">✓ TRANSAÇÃO APROVADA</text>
</svg>`;

    // Salvar como SVG primeiro
    const svgPath = path.join(uploadDir, 'test-comprovante-email.svg');
    fs.writeFileSync(svgPath, svgContent);
    console.log('✅ Imagem SVG criada:', svgPath);

    // Criar também uma versão PNG simples
    fs.writeFileSync(imagePath, pngData);
    console.log('✅ Imagem PNG criada:', imagePath);

    // Verificar se os arquivos foram criados
    const svgExists = fs.existsSync(svgPath);
    const pngExists = fs.existsSync(imagePath);

    console.log('\n📊 Status dos arquivos:');
    console.log('  - SVG:', svgExists ? '✅ Criado' : '❌ Erro');
    console.log('  - PNG:', pngExists ? '✅ Criado' : '❌ Erro');

    if (svgExists) {
      const svgStats = fs.statSync(svgPath);
      console.log('  - Tamanho SVG:', svgStats.size, 'bytes');
    }

    if (pngExists) {
      const pngStats = fs.statSync(imagePath);
      console.log('  - Tamanho PNG:', pngStats.size, 'bytes');
    }

    console.log('\n🔄 Agora atualize a página no navegador para ver a imagem!');
    console.log('📍 URL da imagem: /uploads/proofs/test-comprovante-email.jpg');

  } catch (error) {
    console.error('❌ Erro ao criar imagem:', error);
  }
}

// Executar
createTestImage();