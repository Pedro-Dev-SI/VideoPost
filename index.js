
const robots = {
   input: require('./robots/inputs.js'),
   text: require('./robots/text.js'),
   state: require('./robots/save-content.js'),
   image: require('./robots/image.js')
}

//Esta função vai agrupar tudo
async function start(){

   // robots.input()
   // await robots.text()
   await robots.image()
   
   const content = robots.state.load()
   console.dir(content, { depth: null })
}
start()