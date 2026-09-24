# Controle de Panos

Aplicação web React + Vite para controle de panos por prédio/área.

## Funcionalidades
- Menu hamburger com prédios.
- Cadastro de prédio, área e tipo de pano.
- Registro diário com data, total, recolhidos, sujos, limpos e responsáveis.
- Cálculo automático de faltas.
- Histórico por prédio.
- Pesquisa.
- Exportação/importação JSON.
- Relatórios PDF por prédio ou geral.
- Layout responsivo para celular e PC.
- Persistência local no navegador via localStorage.

## Instalação
```bash
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente:
`http://localhost:5173`

## Produção
```bash
npm run build
npm run preview
```

Os dados ficam no navegador. Use Exportar JSON regularmente para backup.
