//Readline vai ser útil para pegar o input do usuário via terminal
const readline = require('readline-sync')

const robots = {
   text: require('./robots/text.js')
}

//Esta função vai agrupar tudo
async function start(){
   //Objeto que armazena tudo que for encontardo nas buscas
   const content = {

   }

   //Vai criar  atributos deste objeto e adicionar o valor que as funções retornarem
   content.searchTerm = askAndReturnSearchTerm()
   content.prefix = askAndReturnPrefix()
   content.lang = askAndReturnLang()

   //Passando o conteudo para o robô de texto
   await robots.text(content)

   function askAndReturnSearchTerm(){
      //Este metodo question vai injetar no terminal uma pergunta
      return readline.question('Type a word for searching: ')
   }

   function askAndReturnPrefix(){
      const prefixes = ['Who is', 'What is', 'The History of']
      const selectedPrefixIndex = readline.keyInSelect(prefixes, 'Select one option: ')
      const selectedPrefixText = prefixes[selectedPrefixIndex];
      return selectedPrefixText
   }

   function askAndReturnLang(){
      const lang = ['pt', 'en']
      const selectedLangIndex = readline.keyInSelect(lang, 'Select a language: ')
      const selectedLangText = lang[selectedLangIndex]
      return selectedLangText
   }

   console.log(content)

}
start()