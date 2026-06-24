const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runVisualTests() {
    const evidenceDir = path.join(__dirname, 'test_evidence');
    
    // Garantir que a pasta de evidências exista
    if (!fs.existsSync(evidenceDir)) {
        fs.mkdirSync(evidenceDir);
    }
    
    console.log('Iniciando o navegador Chromium via Pipes de Sistema...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        pipe: true, // <-- CRUCIAL: Comunicação via Pipes de OS para passar por Firewalls e restrições de loopback
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });
    
    try {
        const page = await browser.newPage();
        
        // Ajustar a resolução da tela
        await page.setViewport({ width: 1280, height: 800 });
        
        // Caminho do arquivo index.html local usando file://
        const fileUrl = `file://${path.resolve(__dirname, 'index.html')}`;
        console.log(`Abrindo a página: ${fileUrl}`);
        
        await page.goto(fileUrl, { waitUntil: 'networkidle0' });
        
        // 1. Evidência em Português (Padrão)
        console.log('Capturando evidência em Português...');
        await page.screenshot({ path: path.join(evidenceDir, '01_layout_pt.png'), fullPage: true });
        
        // 2. Mudar para Inglês (EN)
        console.log('Alternando para o idioma Inglês (EN)...');
        await page.click('#btn-lang-en');
        await page.waitForTimeout(300); // Aguardar transição suave de fade
        await page.screenshot({ path: path.join(evidenceDir, '02_layout_en.png'), fullPage: true });
        
        // 3. Mudar para Italiano (IT)
        console.log('Alternando para o idioma Italiano (IT)...');
        await page.click('#btn-lang-it');
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(evidenceDir, '03_layout_it.png'), fullPage: true });
        
        // 4. Mudar para Light Mode
        console.log('Ativando o Light Mode (Tema Claro)...');
        await page.click('#btn-theme-toggle');
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(evidenceDir, '04_theme_light.png'), fullPage: true });
        
        // 5. Testar envio do formulário de contato
        console.log('Preenchendo formulário de contato...');
        await page.type('#form-name', 'Teste Evidência');
        await page.type('#form-email', 'suporte@neosol.com.br');
        await page.type('#form-subject', 'Teste de Integração Visual');
        await page.type('#form-message', 'Esta é uma mensagem de teste automatizado para validação das regras da sandbox.');
        
        console.log('Enviando o formulário...');
        await page.click('#btn-submit-form');
        
        // Aguardar o feedback de sucesso aparecer
        await page.waitForSelector('#form-feedback-message.success', { timeout: 5000 });
        await page.screenshot({ path: path.join(evidenceDir, '05_form_submitted.png'), fullPage: false });
        
        console.log('🎉 Todos os testes de validação visual e lógica concluídos com sucesso!');
        console.log(`As imagens de evidência foram salvas em: ${evidenceDir}`);
        
    } catch (error) {
        console.error('❌ Erro durante a execução dos testes:', error);
    } finally {
        await browser.close();
    }
}

// Adaptar waitForTimeout para compatibilidade em versões modernas do Puppeteer
if (!puppeteer.Page.prototype.waitForTimeout) {
    puppeteer.Page.prototype.waitForTimeout = function (milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    };
}

runVisualTests();
