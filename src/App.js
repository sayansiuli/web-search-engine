import { useState, useEffect, useRef } from 'react';
import * as mobilenet from "@tensorflow-models/mobilenet";

function App() {
    const [isModelLoading, setIsModelLoading] = useState(false)
    const [model, setModel] = useState(null)
    const [imageURL, setImageURL] = useState(null);
    const [results, setResults] = useState([])
    const [history, setHistory] = useState([])

    const imageRef = useRef()
    const textInputRef = useRef()
    const fileInputRef = useRef()

    const loadModel = async () => {
        setIsModelLoading(true)
        try {
            const model = await mobilenet.load()
            setModel(model)
            setIsModelLoading(false)
        } catch (error) {
            console.log(error)
            setIsModelLoading(false)
        }
    }

    const uploadImage = (e) => {
        const { files } = e.target
        if (files.length > 0) {
            const url = URL.createObjectURL(files[0])
            setImageURL(url)
        } else {
            setImageURL(null)
        }
    }

    const identify = async () => {
        textInputRef.current.value = ''
        const results = await model.classify(imageRef.current)
        setResults(results)
        const searchResults = document.getElementById('wikiresults');
        searchResults.innerHTML = '';
    }

    const handleOnChange = (e) => {
        setImageURL(e.target.value)
        setResults([])
    }

    const triggerUpload = () => {
        fileInputRef.current.click()
    }

    async function searchWikipedia(searchQuery) {
        const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=20&srsearch=${searchQuery}`;
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw Error(response.statusText);
        }
        const json = await response.json();
        return json;
    }

    async function handleSearch(results) {
        if(results.length > 0 && results[0].className){
            const res = await searchWikipedia(results[0].className);
            displayResults(res);
        }
    }

    function displayResults(results) {
        const searchResults = document.getElementById('wikiresults');
      
        results.query.search.forEach(result => {
          const url = `https://en.wikipedia.org/?curid=${result.pageid}`;
      
          searchResults.insertAdjacentHTML(
            'beforeend',
            `<div class="result-item">
                <a href="${url}" target="_blank" rel="noopener">
                    <h3 class="result-title">
                        ${result.title}
                    </h3>
                    <a href="${url}" class="result-link" target="_blank" rel="noopener">${url}</a>
                    <span class="result-snippet">${result.snippet}</span><br>
                </a>
            </div>`
          );
        });
    }
    
    useEffect(()=>{
        handleSearch(results);
    },[results])

    useEffect(() => {
        loadModel()
    }, [])

    useEffect(() => {
        if (imageURL) {
            setHistory([imageURL, ...history])
        }
    }, [imageURL])

    if (isModelLoading) {
        return <h2>Model Loading...</h2>
    }

    return (
        <div className="App">
            <h1 className='header'>Image Identification</h1>
            <div className='inputHolder'>
                <input type='file' accept='image/*' capture='camera' className='uploadInput' onChange={uploadImage} ref={fileInputRef} />
                <input type="text" placeholder='Paster image URL' ref={textInputRef} onChange={handleOnChange} />
                <button className='uploadImage' onClick={triggerUpload}>Upload Image</button>
            </div>
            <div className="mainWrapper">
                <div className="mainContent">
                    <div className="imageHolder">
                        {imageURL && <img src={imageURL} alt="Upload Preview" crossOrigin="anonymous" ref={imageRef} width="200px" />}
                        {imageURL && (
                            <div className="btn-result-block">
                                <button className='button' onClick={identify}>Identify Image</button>
                                {results.length > 0 && <div className='resultsHolder'>
                        {results.map((result, index) => {
                            return (
                                <div className='result' key={result.className}>
                                    <span className='name'>{result.className}</span>
                                    <span className='confidence'>Confidence level: {(result.probability * 100).toFixed(2)}% {index === 0 && <span className='bestGuess'>Best Guess</span>}</span>
                                </div>
                            )
                        })}
                    </div>}
                            </div>
                        )}
                    </div>
                    <div id='wikiresults'></div>
                </div>
                {history.length > 0 && <div className="recentPredictions">
                <h2>Recent Images</h2>
                <div className="recentImages">
                    {history.map((image, index) => {
                        return (
                            <div className="recentPrediction" key={`${image}${index}`}>
                                <img src={image} alt='Recent Prediction' onClick={() => setImageURL(image)} width="200px" />
                            </div>
                        )
                    })}
                </div>
            </div>}  
            </div>  
        </div>
    );
}

export default App;
