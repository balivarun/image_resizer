import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import { Upload, Download, Image as ImageIcon, Scissors, RotateCcw, Palette, Settings, Zap, Grid, Sliders, FileImage, Layers, Sparkles, Camera, Filter } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [resizeWidth, setResizeWidth] = useState('');
  const [resizeHeight, setResizeHeight] = useState('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [scalePercent, setScalePercent] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [outputFormat, setOutputFormat] = useState('png');
  const [quality, setQuality] = useState(90);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [activeTab, setActiveTab] = useState('resize');
  const [batchFiles, setBatchFiles] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [showBatchMode, setShowBatchMode] = useState(false);
  const [presetSizes] = useState([
    { name: 'Instagram Square', width: 1080, height: 1080, icon: '📷' },
    { name: 'Instagram Story', width: 1080, height: 1920, icon: '📱' },
    { name: 'Facebook Cover', width: 851, height: 315, icon: '🌐' },
    { name: 'Twitter Header', width: 1500, height: 500, icon: '🐦' },
    { name: 'YouTube Thumbnail', width: 1280, height: 720, icon: '🎥' },
    { name: 'LinkedIn Cover', width: 1584, height: 396, icon: '💼' }
  ]);

  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = useCallback((file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setError('');
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target.result;
      setImageUrl(url);
      setSelectedImage(file);
      
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setResizeWidth(img.width.toString());
        setResizeHeight(img.height.toString());
        setIsLoading(false);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, []);

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget;
    setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, width, height), width, height));
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (showBatchMode && files.length > 1) {
      setBatchFiles(files.filter(f => f.type.startsWith('image/')));
    } else if (files[0]) {
      handleImageUpload(files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (showBatchMode && imageFiles.length > 1) {
      setBatchFiles(imageFiles);
    } else if (imageFiles[0]) {
      handleImageUpload(imageFiles[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleResizeChange = (dimension, value) => {
    if (dimension === 'width') {
      setResizeWidth(value);
      if (maintainAspectRatio && originalDimensions.width && originalDimensions.height) {
        const aspectRatio = originalDimensions.height / originalDimensions.width;
        setResizeHeight(Math.round(parseInt(value) * aspectRatio).toString());
      }
    } else {
      setResizeHeight(value);
      if (maintainAspectRatio && originalDimensions.width && originalDimensions.height) {
        const aspectRatio = originalDimensions.width / originalDimensions.height;
        setResizeWidth(Math.round(parseInt(value) * aspectRatio).toString());
      }
    }
  };

  const handleScaleChange = (percent) => {
    setScalePercent(percent);
    if (originalDimensions.width && originalDimensions.height) {
      const newWidth = Math.round((originalDimensions.width * percent) / 100);
      const newHeight = Math.round((originalDimensions.height * percent) / 100);
      setResizeWidth(newWidth.toString());
      setResizeHeight(newHeight.toString());
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imgRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelRatio = window.devicePixelRatio;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    let sourceX = 0;
    let sourceY = 0;
    let sourceWidth = image.naturalWidth;
    let sourceHeight = image.naturalHeight;

    if (completedCrop) {
      sourceX = completedCrop.x * scaleX;
      sourceY = completedCrop.y * scaleY;
      sourceWidth = completedCrop.width * scaleX;
      sourceHeight = completedCrop.height * scaleY;
    }

    const targetWidth = parseInt(resizeWidth) || sourceWidth;
    const targetHeight = parseInt(resizeHeight) || sourceHeight;

    canvas.width = targetWidth * pixelRatio;
    canvas.height = targetHeight * pixelRatio;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';
    
    // Apply filters
    const filters = [];
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    if (blur > 0) filters.push(`blur(${blur}px)`);
    if (filters.length > 0) ctx.filter = filters.join(' ');

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      targetWidth,
      targetHeight
    );

    return canvas;
  }, [completedCrop, resizeWidth, resizeHeight, brightness, contrast, saturation, blur]);

  const downloadImage = () => {
    const canvas = drawCanvas();
    if (!canvas) return;

    const mimeType = outputFormat === 'jpg' ? 'image/jpeg' : `image/${outputFormat}`;
    const qualityValue = outputFormat === 'png' ? undefined : quality / 100;
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fileName = selectedImage?.name?.replace(/\.[^/.]+$/, '') || 'image';
      a.href = url;
      a.download = `processed-${fileName}.${outputFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, mimeType, qualityValue);
  };

  const processBatchImages = async () => {
    if (batchFiles.length === 0) return;
    
    setProcessing(true);
    setBatchProgress(0);
    
    for (let i = 0; i < batchFiles.length; i++) {
      const file = batchFiles[i];
      const progress = ((i + 1) / batchFiles.length) * 100;
      setBatchProgress(progress);
      
      await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const targetWidth = parseInt(resizeWidth) || img.width;
            const targetHeight = parseInt(resizeHeight) || img.height;
            
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            
            // Apply filters
            const filters = [];
            if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
            if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
            if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
            if (blur > 0) filters.push(`blur(${blur}px)`);
            if (filters.length > 0) ctx.filter = filters.join(' ');
            
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            
            const mimeType = outputFormat === 'jpg' ? 'image/jpeg' : `image/${outputFormat}`;
            const qualityValue = outputFormat === 'png' ? undefined : quality / 100;
            
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const fileName = file.name.replace(/\.[^/.]+$/, '') || 'image';
                a.href = url;
                a.download = `processed-${fileName}.${outputFormat}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }
              resolve();
            }, mimeType, qualityValue);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setProcessing(false);
    setBatchProgress(100);
    setTimeout(() => setBatchFiles([]), 1000);
  };

  const applyPresetSize = (preset) => {
    setResizeWidth(preset.width.toString());
    setResizeHeight(preset.height.toString());
    setMaintainAspectRatio(false);
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
  };

  const resetImage = () => {
    setSelectedImage(null);
    setImageUrl('');
    setCrop();
    setCompletedCrop();
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4 flex items-center justify-center gap-3">
            <div className="relative">
              <Camera className="text-blue-400 animate-pulse" size={48} />
              <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-bounce" size={20} />
            </div>
            Pro Image Studio
          </h1>
          <p className="text-gray-300 text-lg mb-6">Professional image editing with AI-powered filters and batch processing</p>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => setShowBatchMode(false)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                !showBatchMode 
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 transform scale-105' 
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
              }`}
            >
              <FileImage size={20} />
              Single Edit
            </button>
            <button
              onClick={() => setShowBatchMode(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                showBatchMode 
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25 transform scale-105' 
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
              }`}
            >
              <Layers size={20} />
              Batch Process
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 animate-shake">
            {error}
          </div>
        )}

        {showBatchMode && batchFiles.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-purple-400/50 rounded-xl p-16 text-center hover:border-purple-400 hover:bg-purple-400/5 transition-all duration-300 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="relative mb-6">
                <Layers className="mx-auto text-gray-400 group-hover:text-purple-400 transition-colors duration-300" size={64} />
                <div className="absolute inset-0 blur-2xl bg-purple-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3 group-hover:text-purple-300 transition-colors">
                Drop multiple images for batch processing
              </h3>
              <p className="text-gray-400 mb-6 text-lg">Select multiple files to process them all at once</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Select Multiple Images
              </button>
            </div>
          </div>
        ) : showBatchMode && batchFiles.length > 0 ? (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Layers size={20} className="text-purple-400" />
                  Batch Queue ({batchFiles.length} images)
                </h2>
                <button
                  onClick={() => setBatchFiles([])}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 max-h-60 overflow-y-auto">
                {batchFiles.map((file, index) => (
                  <div key={index} className="relative bg-black/20 rounded-lg p-3 border border-gray-600">
                    <div className="text-sm text-white truncate mb-1">{file.name}</div>
                    <div className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                ))}
              </div>
              
              {processing && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-300">Processing images...</span>
                    <span className="text-sm text-blue-400">{Math.round(batchProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${batchProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <button
                onClick={processBatchImages}
                disabled={processing || batchFiles.length === 0}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 disabled:transform-none font-semibold"
              >
                <Zap size={20} className={processing ? 'animate-spin' : 'animate-bounce'} />
                {processing ? 'Processing...' : `Process ${batchFiles.length} Images`}
              </button>
            </div>
          </div>
        ) : !selectedImage ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/10">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-blue-400/50 rounded-xl p-16 text-center hover:border-blue-400 hover:bg-blue-400/5 transition-all duration-300 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="relative mb-6">
                <Upload className="mx-auto text-gray-400 group-hover:text-blue-400 transition-colors duration-300" size={64} />
                <div className="absolute inset-0 blur-2xl bg-blue-400/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3 group-hover:text-blue-300 transition-colors">
                Drag and drop your image here
              </h3>
              <p className="text-gray-400 mb-6 text-lg">or click to browse files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-8 py-3 rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                Choose File
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Image Preview</h2>
                  <button
                    onClick={resetImage}
                    className="flex items-center gap-2 bg-gray-600/50 text-white px-4 py-2 rounded-lg hover:bg-gray-500/50 transition-all duration-300 backdrop-blur-sm border border-gray-400/30"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-blue-400/50"></div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-96 rounded-lg">
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                    >
                      <img
                        ref={imgRef}
                        src={imageUrl}
                        onLoad={onImageLoad}
                        alt="Upload preview"
                        className="max-w-full h-auto rounded-lg shadow-lg"
                        style={{
                          filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) blur(${blur}px)`
                        }}
                      />
                    </ReactCrop>
                  </div>
                )}
              </div>

              <canvas
                ref={canvasRef}
                className="hidden"
              />
            </div>

            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/10">
                <div className="flex space-x-1 mb-6 bg-black/20 rounded-lg p-1">
                  {[
                    {id: 'resize', icon: Scissors, label: 'Resize'}, 
                    {id: 'filters', icon: Palette, label: 'Filters'}, 
                    {id: 'presets', icon: Grid, label: 'Presets'}, 
                    {id: 'export', icon: Settings, label: 'Export'}
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                        activeTab === tab.id 
                          ? 'bg-blue-500 text-white shadow-lg transform scale-105' 
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'resize' && (
                  <div className="space-y-6 animate-fade-in">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Scale Percentage
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={scalePercent}
                        onChange={(e) => handleScaleChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <div className="text-center text-sm text-blue-400 mt-2 font-medium">
                        {scalePercent}%
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="aspectRatio"
                        checked={maintainAspectRatio}
                        onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                        className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500 bg-gray-700 border-gray-600"
                      />
                      <label htmlFor="aspectRatio" className="text-sm text-gray-300">
                        Maintain aspect ratio
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Width (px)
                        </label>
                        <input
                          type="number"
                          value={resizeWidth}
                          onChange={(e) => handleResizeChange('width', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Height (px)
                        </label>
                        <input
                          type="number"
                          value={resizeHeight}
                          onChange={(e) => handleResizeChange('height', e.target.value)}
                          className="w-full px-3 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'filters' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-white font-medium flex items-center gap-2">
                        <Filter size={18} />
                        Image Filters
                      </h4>
                      <button
                        onClick={resetFilters}
                        className="text-xs bg-gray-600/50 hover:bg-gray-500/50 px-3 py-1 rounded-lg transition-colors text-gray-300"
                      >
                        Reset All
                      </button>
                    </div>
                    
                    {[
                      {label: 'Brightness', value: brightness, setValue: setBrightness, min: 0, max: 200, unit: '%'},
                      {label: 'Contrast', value: contrast, setValue: setContrast, min: 0, max: 200, unit: '%'},
                      {label: 'Saturation', value: saturation, setValue: setSaturation, min: 0, max: 200, unit: '%'},
                      {label: 'Blur', value: blur, setValue: setBlur, min: 0, max: 10, unit: 'px'}
                    ].map((filter) => (
                      <div key={filter.label}>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-300">{filter.label}</label>
                          <span className="text-xs text-blue-400 font-medium">{filter.value}{filter.unit}</span>
                        </div>
                        <input
                          type="range"
                          min={filter.min}
                          max={filter.max}
                          value={filter.value}
                          onChange={(e) => filter.setValue(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'presets' && (
                  <div className="space-y-4 animate-fade-in">
                    <h4 className="text-white font-medium flex items-center gap-2 mb-4">
                      <Grid size={18} />
                      Social Media Presets
                    </h4>
                    <div className="grid grid-cols-1 gap-3">
                      {presetSizes.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => applyPresetSize(preset)}
                          className="flex justify-between items-center p-3 bg-gray-800/50 hover:bg-blue-500/20 border border-gray-600 hover:border-blue-400 rounded-lg transition-all duration-300 text-gray-300 hover:text-white"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{preset.icon}</span>
                            <span className="font-medium">{preset.name}</span>
                          </div>
                          <span className="text-sm text-blue-400">{preset.width} × {preset.height}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'export' && (
                  <div className="space-y-6 animate-fade-in">
                    <h4 className="text-white font-medium flex items-center gap-2 mb-4">
                      <Download size={18} />
                      Export Settings
                    </h4>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Output Format
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {['png', 'jpg', 'webp'].map((format) => (
                          <button
                            key={format}
                            onClick={() => setOutputFormat(format)}
                            className={`p-3 rounded-lg border transition-all duration-300 ${
                              outputFormat === format
                                ? 'bg-blue-500 border-blue-400 text-white'
                                : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-blue-500/10 hover:border-blue-400'
                            }`}
                          >
                            {format.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {outputFormat !== 'png' && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-300">Quality</label>
                          <span className="text-xs text-blue-400 font-medium">{quality}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(parseInt(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Layers size={20} className="text-blue-400" />
                  Image Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                    <span className="text-gray-300">Original:</span>
                    <span className="font-medium text-blue-400">
                      {originalDimensions.width} × {originalDimensions.height}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                    <span className="text-gray-300">Output:</span>
                    <span className="font-medium text-purple-400">
                      {resizeWidth || 0} × {resizeHeight || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                    <span className="text-gray-300">Format:</span>
                    <span className="font-medium text-green-400 uppercase">
                      {outputFormat}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-black/20 rounded-lg">
                    <span className="text-gray-300">File:</span>
                    <span className="font-medium text-yellow-400 truncate max-w-32" title={selectedImage?.name}>
                      {selectedImage?.name}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={downloadImage}
                disabled={!selectedImage || isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg transform hover:scale-105 disabled:transform-none font-semibold"
              >
                <Download size={22} className="animate-bounce" />
                Download {outputFormat.toUpperCase()} Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;