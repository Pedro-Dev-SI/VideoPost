
const robots = {
   input: require('./robots/inputs.js'),
   text: require('./robots/text.js'),
   state: require('./robots/save-content.js')
}

//Esta função vai agrupar tudo
async function start(){

   robots.input()
   //Passando o conteudo para o robô de texto
   await robots.text()

   const content = robots.state.load()
   console.dir(content, { depth: null })
}
start()