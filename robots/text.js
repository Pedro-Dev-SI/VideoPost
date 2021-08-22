const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/apiKey.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(content){
   //Baixar conteudo do wikipedia
   await fetchContentFromWikipedia(content)

   //Limpar o conteudo
   sanitizeContent(content)

   //Quebrar o conteudo em sentenças
   breakContentIntoSentences(content)

   //!IMPORTANTE PARA OUTRAS IMPLEMENTAÇÕES
   //*Busca conteudo no wikipedia
   async function fetchContentFromWikipedia(content){
      //Autentica
      const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
      //Busca o algoritmo
      const wikipediaAlgorithm = algorithmiaAuthenticated.algo("web/WikipediaParser/0.1.2")
      //Executa o algoritmo
      const wikipediaResponse = await wikipediaAlgorithm.pipe({
         "lang": content.lang,
         "articleName": content.searchTerm
      })
      //Retorna a resposta
      const wikipediaContent = wikipediaResponse.get()
      content.sourceContentOriginal = wikipediaContent.content
   }

   //*Limpa o conteudo
   function sanitizeContent(content){
      const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal)
      const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)
      content.sourceContentSanitized = withoutDatesInParentheses

      function removeBlankLinesAndMarkdown(text) {
         const allLines = text.split('\n')
         const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
            if (line.trim().length === 0 || line.trim().startsWith('=')) return false
            return true
         })
         return withoutBlankLinesAndMarkdown.join(' ')
      }

      function removeDatesInParentheses(text){
         return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
      }
   }

   //*Quebra o conteudo em sentenças
   function breakContentIntoSentences(content){

      content.sentences = []

      const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized)
      sentences.forEach((sentence) => {
         content.sentences.push({
            text: sentence,
            keywords: [],
            images: []
         })
      })
   }
}

module.exports = robot;