import React, { useRef, useEffect, useState } from 'react';
import { Download, Trash2, Wand2 } from 'lucide-react';

export default function DrawingApp() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [tool, setTool] = useState('brush');
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
  }, []);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = history[newStep];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.src = history[newStep];
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveHistory();
    setGeneratedImage(null);
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = 'drawing.png';
    link.click();
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext('2d');
    if (tool === 'brush') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (tool === 'eraser') {
      ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvasRef.current.getContext('2d');

    if (tool === 'brush') {
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = brushColor;
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.closePath();
      setIsDrawing(false);
      saveHistory();
    }
  };

  const generateImage = async () => {
    if (!apiKey) {
      alert('Please enter your ModelsLab API key');
      return;
    }
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    setLoading(true);
    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL('image/png');

      const response = await fetch('https://api.modelslab.com/api/v6/images/img2img', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: apiKey,
          init_image: imageData,
          prompt: prompt,
          negative_prompt: '',
          strength: 0.5,
          guidance_scale: 7.5,
          seed: Math.floor(Math.random() * 1000000),
          samples: 1,
          steps: 30,
          safety_checker: true,
        }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.output && data.output.length > 0) {
        setGeneratedImage(data.output[0]);
      } else if (data.message) {
        alert('Error: ' + data.message);
      } else {
        alert('Generation failed. Check your API key and try again.');
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-6">Draw & Generate</h1>

        {showApiKeyInput && (
          <div className="bg-slate-700 p-4 rounded-lg mb-6 border border-slate-600">
            <p className="text-white mb-2">Enter your ModelsLab API key to enable image generation:</p>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Your ModelsLab API key"
                className="flex-1 px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 placeholder-slate-400"
              />
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
              >
                Done
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Get a free API key at <a href="https://modelslab.com" target="_blank" rel="noopener noreferrer" className="underline">modelslab.com</a>
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Canvas Section */}
          <div className="lg:col-span-2">
            <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
              <canvas
                ref={canvasRef}
                width={600}
                height={500}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="border-2 border-slate-500 rounded bg-white cursor-crosshair w-full"
              />

              {/* Toolbar */}
              <div className="mt-4 space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setTool('brush')}
                    className={`px-4 py-2 rounded font-medium transition ${
                      tool === 'brush'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                    }`}
                  >
                    Brush
                  </button>
                  <button
                    onClick={() => setTool('eraser')}
                    className={`px-4 py-2 rounded font-medium transition ${
                      tool === 'eraser'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                    }`}
                  >
                    Eraser
                  </button>
                  <button
                    onClick={undo}
                    className="px-4 py-2 bg-slate-600 text-slate-200 hover:bg-slate-500 rounded font-medium transition"
                  >
                    Undo
                  </button>
                  <button
                    onClick={redo}
                    className="px-4 py-2 bg-slate-600 text-slate-200 hover:bg-slate-500 rounded font-medium transition"
                  >
                    Redo
                  </button>
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-slate-300 text-sm">Color:</label>
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-slate-300 text-sm">Size:</label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-slate-300 text-sm">{brushSize}px</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={downloadDrawing}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition"
                  >
                    <Download size={18} /> Download
                  </button>
                  <button
                    onClick={clearCanvas}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition"
                  >
                    <Trash2 size={18} /> Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Generation Section */}
          <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Wand2 size={24} /> Generate
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm mb-2">Prompt:</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to generate..."
                  className="w-full h-24 px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 placeholder-slate-400 text-sm"
                />
              </div>

              <button
                onClick={generateImage}
                disabled={loading}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-500 text-white rounded font-bold transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} /> Generate Image
                  </>
                )}
              </button>

              {generatedImage && (
                <div>
                  <p className="text-slate-300 text-sm mb-2">Generated Result:</p>
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full rounded border border-slate-500"
                  />
                  <a
                    href={generatedImage}
                    download="generated.png"
                    className="block mt-2 text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}