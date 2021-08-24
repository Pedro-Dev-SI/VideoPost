const state = require('./save-content.js')
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const googleSearchCredentials = require('../credentials/google-search.json')
const imageDownloader = require('image-downloader')

async function robot(){
   const content = state.load()

   await fetchImagesOfAllSentences(content)

   await downloadAllImages(content)

   state.save(content)

   async function fetchImagesOfAllSentences(content){
      for (const sentence of content.sentences) {
         const query = `${content.searchTerm} ${sentence.keywords[0]}`
         sentence.images = await fetchGoogleAndReturnImagesLink(query)

         sentence.googleSearchQuery = query
      }
   }

   async function fetchGoogleAndReturnImagesLink(query){
      const response = await customSearch.cse.list({
         auth: googleSearchCredentials.apiKey,
         cx: googleSearchCredentials.searchEngineID,
         q: query,
         searchType: 'image',
         num: 2
      })

      const imgsUrl = response.data.items.map((item) => {
         return item.link
      })
      return imgsUrl
   }

   async function downloadAllImages(content){

      content.downloadedImages = []

      for(let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
         const images = content.sentences[sentenceIndex].images

         for(let imageIndex = 0; imageIndex < images.length; imageIndex++) {
            const imgUrl = images[imageIndex]

            try{

               if(content.downloadedImages.includes(imgUrl)){
                  throw new Error('This image has already been downloaded.')
               }

               await downloadAndSave(imgUrl, `${sentenceIndex}-original.png`)
               content.downloadedImages.push(imgUrl)
               console.log(`[${sentenceIndex}] [${imageIndex}] Image downloaded successfully: ${imgUrl}`)
               break
            }catch(err){
               console.log(`[${sentenceIndex}] [${imageIndex}] An error has occurred while downloading (${imgUrl}): ${err}`)
            }
         }
      }
   }

   async function downloadAndSave(url, fileName){
      return imageDownloader.image({
         url, url,
         dest: `./content/${fileName}`
      })
   }
   
}

module.exports = robot