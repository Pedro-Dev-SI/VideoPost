const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/apiKey.json').apiKey
const sentenceBoundaryDetection = require('sbd')
const watson = require('../credentials/watson-nlu.json')

const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js')
 
var nlu = new NaturalLanguageUnderstandingV1({
  iam_apikey: watson.apikey,
  version: '2018-04-05',
  url: watson.url
})

// nlu.analyze({
//    text: `Hi I'm Peter Parker and I love to save my neighborhood`,
//    features: {
//       keywords: {}
//    }
// }, (error, response) => {
//    if (error){
//       throw error;
//    }
//    console.log(JSON.stringify(response, null, 4))
//    process.exit(0)
// })

async function robot(content){
   //Baixar conteudo do wikipedia
   await fetchContentFromWikipedia(content)

   //Limpar o conteudo
   sanitizeContent(content)

   //Quebrar o conteudo em sentenças
   breakContentIntoSentences(content)

   //Limite de máximo de sentenças
   limitMaximumSentences(content)

   //Preenche as keywords de cada sentença
   await fetchKeywordsOfAllSentences(content)

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

   function limitMaximumSentences(content){
      content.sentences = content.sentences.slice(0, content.maximumSentences)
   }

   async function fetchKeywordsOfAllSentences(content){
      for(const sentence of content.sentences) {
         sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
      }
   }

   async function fetchWatsonAndReturnKeywords(sentence){
      return new Promise((resolve, reject) => {
         nlu.analyze({
            text: sentence,
            features: {
               keywords: {}
            }
         }, (err, res) => {
            if(err){
               throw err
            }
            const keywords = res.keywords.map((keyword) => {
               return keyword.text
            })
            resolve(keywords)
         })
      })
   }
}

module.exports = robot;