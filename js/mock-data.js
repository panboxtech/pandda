window.MockData = {
  planos: [
    { id:'p1', nome:'Básico', pontos:10, valor:29.9, validade:1 },
    { id:'p2', nome:'Pro', pontos:30, valor:69.9, validade:3 },
    { id:'p3', nome:'Anual', pontos:120, valor:199.9, validade:12 },
  ],
  servidores: [
    { id:'s1', nome:'Servidor Alpha', url1:'https://alpha.example' },
    { id:'s2', nome:'Servidor Beta', url1:'https://beta.example' },
    { id:'s3', nome:'Servidor Gamma', url1:'https://gamma.example' },
  ],
  clientes: (() => {
    const base = new Date();
    return [
      { id:'c1', nome:'Ana Silva', whatsapp:'+5591988887777', dataCriacao:'', dataVencimento:new Date(base.getFullYear(), base.getMonth()+1, base.getDate()).toISOString().slice(0,10), planoId:'p1', servidor1:'s1', statusNotificacao:true, observacoes:'VIP', bloqueado:false},
      { id:'c2', nome:'Bruno Costa', whatsapp:'+5591999991111', dataCriacao:'', dataVencimento:new Date(base.getTime()+1000*60*60*24*3).toISOString().slice(0,10), planoId:'p2', servidor1:'s2', statusNotificacao:false, observacoes:'', bloqueado:false},
      { id:'c3', nome:'Carla Nunes', whatsapp:'+5591983332222', dataCriacao:'', dataVencimento:new Date(base.getTime()-1000*60*60*24*2).toISOString().slice(0,10), planoId:'p1', servidor1:'s3', statusNotificacao:false, observacoes:'', bloqueado:false},
    ];
  })()
};
