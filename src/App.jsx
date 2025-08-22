import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import { Upload, Download, Image as ImageIcon, Scissors, RotateCcw } from 'lucide-react';
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
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
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
  }, [completedCrop, resizeWidth, resizeHeight]);

  const downloadImage = () => {
    const canvas = drawCanvas();
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `processed-${selectedImage?.name || 'image.png'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <ImageIcon className="text-blue-600" size={40} />
            Image Resizer & Cropper
          </h1>
          <p className="text-gray-600">Upload, resize, and crop your images with ease</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {!selectedImage ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Drag and drop your image here
              </h3>
              <p className="text-gray-500 mb-4">or click to browse files</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Choose File
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Image Preview</h2>
                  <button
                    onClick={resetImage}
                    className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <RotateCcw size={16} />
                    Reset
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-auto max-h-96">
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
                        className="max-w-full h-auto"
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
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Scissors size={20} />
                  Resize Controls
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scale Percentage
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="200"
                      value={scalePercent}
                      onChange={(e) => handleScaleChange(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-center text-sm text-gray-600 mt-1">
                      {scalePercent}%
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="aspectRatio"
                      checked={maintainAspectRatio}
                      onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="aspectRatio" className="text-sm text-gray-700">
                      Maintain aspect ratio
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Width (px)
                      </label>
                      <input
                        type="number"
                        value={resizeWidth}
                        onChange={(e) => handleResizeChange('width', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (px)
                      </label>
                      <input
                        type="number"
                        value={resizeHeight}
                        onChange={(e) => handleResizeChange('height', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Image Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Original:</span>
                    <span className="font-medium">
                      {originalDimensions.width} × {originalDimensions.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Output:</span>
                    <span className="font-medium">
                      {resizeWidth || 0} × {resizeHeight || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">File:</span>
                    <span className="font-medium truncate max-w-32">
                      {selectedImage?.name}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={downloadImage}
                disabled={!selectedImage || isLoading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Processed Image
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;