const state = require('./save-content.js')
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
const googleSearchCredentials = require('../credentials/google-search.json')
const imageDownloader = require('image-downloader')
const gm = require('gm').subClass({imageMagick: true})

async function robot(){
   const content = state.load()

   await fetchImagesOfAllSentences(content)

   await downloadAllImages(content)

   await convertAllImagesContent(content)

   await createAllSentencesImage(content)

   await createYouTubeThumbnail()

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

   async function convertAllImagesContent(content){
      for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
         await convertImage(sentenceIndex)
      }
   }

   async function convertImage(sentenceIndex) {
      return new Promise((resolve, reject) => {
         const inputFile = `./content/${sentenceIndex}-original.png[0]`
         const outputFile = `./content/${sentenceIndex}-converted.png`
         const width = 1920
         const height = 1080

         gm()
            .in(inputFile)
            .out('(')
               .out('-clone')
               .out('0')
               .out('-background', 'white')
               .out('-blur', '0x9')
               .out('-resize', `${width}x${height}^`)
            .out(')')
            .out('(')
               .out('-clone')
               .out('0')
               .out('-background', 'white')
               .out('-resize', `${width}x${height}`)
            .out(')')
            .out('-delete', '0')
            .out('-gravity', 'center')
            .out('-compose', 'over')
            .out('-composite')
            .out('-extent', `${width}x${height}`)
            .write(outputFile, (error) => {
               if(error){
                  console.log(`Unable to convert this image: ${error}`)
               }else{
                  console.log(`Image converted: ${inputFile}`)
               }
               resolve()
               
            })
      })

   }

   async function createAllSentencesImage(content){
      for(let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
         await createSentenceImage(sentenceIndex, content.sentences[sentenceIndex].text)
      }
   }

   async function createSentenceImage(sentenceIndex, sentenceText){
      return new Promise((resolve, reject) => {
         const outputFile = `./content/${sentenceIndex}-sentence.png`

         const templateSettings = {
            0: {
              size: '1920x400',
              gravity: 'center'
            },
            1: {
              size: '1920x1080',
              gravity: 'center'
            },
            2: {
              size: '800x1080',
              gravity: 'west'
            },
            3: {
              size: '1920x400',
              gravity: 'center'
            },
            4: {
              size: '1920x1080',
              gravity: 'center'
            },
            5: {
              size: '800x1080',
              gravity: 'west'
            },
            6: {
              size: '1920x400',
              gravity: 'center'
            }
         }

         gm()
            .out('-size', templateSettings[sentenceIndex].size)
            .out('-gravity', templateSettings[sentenceIndex].gravity)
            .out('-background', 'transparent')
            .out('-fill', 'white')
            .out('-kerning', '-1')
            .out(`caption:${sentenceText}`)
            .write(outputFile, (error) => {
               if (error) {
                  return reject(error)
               }

               console.log(`Sentence created: ${outputFile}`)
               resolve()
            })
      })
   }

   async function createYouTubeThumbnail(){
      return new Promise((resolve, reject) => {
         gm()
            .in('./content/0-converted.png')
            .write('./content/youtube-thumbnail.jpg', (error) => {
               if (error) {
                  return reject(error)
               }

               console.log('YouTube thumbnail created successfully!!')
               resolve()
            })
      })

   }
   
}

module.exports = robot