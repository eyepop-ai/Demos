"use client"

import Processor from "@/processors/processor";
import { useEffect, useRef, useState } from "react"

export const processors = [
  {
    name: "text_ads",
    module: () => import("../processors/text_ads"),
  },
  {
    name: "text_live",
    module: () => import("../processors/text_live"),
  },
  {
    name: "text_license",
    module: () => import("../processors/text_license"),
  },
  {
    name: "trail_live",
    module: () => import("../processors/trail_live"),
  },
  {
    name: "person_pose",
    module: () => import("../processors/person_pose"),
  },
];

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)  
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [showSettings, setShowSettings] = useState(false)
  const drawPreviewRef = useRef<boolean>(true)
  const [showReset, setShowReset] = useState(false)
  const [showLoading, setShowLoading] = useState(false)  

  // Available processors
  const [currentProcessor, setCurrentProcessor] = useState<any | null>(processors[4])
  const currentModuleRef = useRef<any | null>(null)  
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    const fetchDevices = async () => {
      if (typeof navigator !== "undefined" && navigator.mediaDevices) {
        try {
          const allDevices = await navigator.mediaDevices.enumerateDevices()
          setDevices(allDevices.filter(device => device.kind === "videoinput")) // Filter only cameras
        } catch (error) {
          console.error("Error fetching devices:", error)
        }
      }
    }

    fetchDevices()
  }, []) // Runs once after the component mounts

  useEffect(() => {
    startCamera()


    return
  }, [facingMode])

  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode }
      }
      const newStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(newStream)

      const m = await currentProcessor.module()
      currentModuleRef.current = new m.default()
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        videoRef.current.onloadedmetadata = async () => {
          if (!videoRef.current) return

          videoRef.current?.play()
          
          videoRef.current.muted = true

          if (!canvasRef.current) return
          ctxRef.current = canvasRef.current?.getContext("2d")

          drawToCanvas()
          await currentModuleRef.current.setCanvasContext(ctxRef.current, newStream)
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
    }
  }

  const drawToCanvas = () => {
    console.log("drawToCanvas", videoRef.current, canvasRef.current, ctxRef.current)
    if (!videoRef.current || !canvasRef.current) return
    const ctx = ctxRef.current
    if (!ctx) return

    const updateFrame = async () => {
      console.log("updateFrame", drawPreviewRef.current) //videoRef.current, canvasRef.current, ctxRef.current)
      if (!videoRef.current || !canvasRef.current) return requestAnimationFrame(updateFrame)
      if (!drawPreviewRef.current) return requestAnimationFrame(updateFrame)

      DrawImage(videoRef.current, videoRef.current.videoWidth, videoRef.current.videoHeight, false)
      await currentModuleRef.current?.processFrame(ctxRef.current, videoRef.current)

      requestAnimationFrame(updateFrame)
    }

    canvasRef.current.width = window.innerWidth
    canvasRef.current.height = window.innerHeight

    console.log("initial call to updateFrame")
    requestAnimationFrame(updateFrame)
  }

  const processPhoto = async (image: Blob | File) => {
    if (!canvasRef.current) return

    const ctx = ctxRef.current
    if (!ctx) return

    setShowLoading(true)

    console.log("Processing photo with:", currentProcessor)
    await freezeCanvas(image)

    if (image instanceof File) {
      image = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current?.toBlob(blob => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create Blob from canvas."));
          }
        }, "image/jpeg");
      });
    }

    console.log("Processing photo with:", currentProcessor, image)
    await currentModuleRef.current?.processPhoto(image, ctx)

    setShowLoading(false)
  }

  const processVideo = async (video: File) => {
    if (!canvasRef.current) return
    if(!videoRef.current) return

    const ctx = ctxRef.current
    if (!ctx) return

    setShowLoading(true)

    console.log("Processing video with:", currentProcessor)
    //set videoRef to file
    videoRef.current.srcObject = null
    videoRef.current.src = URL.createObjectURL(video)
    // Remove the current function in requestAnimationFrame
    const updateFrame = () => {};
    requestAnimationFrame(updateFrame);
    
    setShowReset(true)

    videoRef.current.crossOrigin = "anonymous"
    videoRef.current.pause()
    
    videoRef.current.onloadedmetadata = async () => {
      //setting up redraw to canvas
      if (!canvasRef.current) return

      if(videoRef.current?.videoWidth && videoRef.current?.videoHeight) {
        canvasRef.current.width = videoRef.current?.videoWidth
        canvasRef.current.height = videoRef.current?.videoHeight
      }

      console.log("videoRef.current?.videoWidth", videoRef.current?.videoWidth, videoRef.current?.videoHeight)
      
    }


    console.log("Processing video with:", currentProcessor, video)
    await currentModuleRef.current?.processVideo(video, ctx)

    videoRef.current.play()
    drawToCanvas()

    setShowLoading(false)
  }

  const DrawImage = (img: any, img_width: number, img_height: number, shouldFill = true) => {
    //console.log("DrawImage", img, img_width, img_height, shouldFill, canvasRef.current, ctxRef.current)
    if (!videoRef.current || !canvasRef.current) return

    const ctx = ctxRef.current
    if (!ctx) return

    //const videoAspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight
    const aspectRatio = img_width / img_height
    const canvasAspectRatio = canvasRef.current.width / canvasRef.current.height


    let drawWidth, drawHeight, offsetX, offsetY

    if ((!shouldFill && (canvasAspectRatio < aspectRatio)) || (shouldFill && canvasAspectRatio > aspectRatio)) {
      drawWidth = canvasRef.current.width
      drawHeight = canvasRef.current.width / aspectRatio
      offsetX = 0
      offsetY = 0 //(canvasRef.current.height - drawHeight) / 2
    } else {
      drawWidth = canvasRef.current.height * aspectRatio
      drawHeight = canvasRef.current.height
      offsetX = 0 //(canvasRef.current.width - drawWidth) / 2
      offsetY = 0
    }

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)
  }

  const takePhoto = () => {
    if (!canvasRef.current) return
    canvasRef.current.toBlob(blob => {
      if (blob) processPhoto(blob)
    }, "image/jpeg")
  }

  const freezeCanvas = async (image: Blob | File) => {
    if (!canvasRef.current) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    drawPreviewRef.current = false;
    setShowReset(true);

    await new Promise<void>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        if (!canvasRef.current) return reject(new Error("Canvas not available"));

        DrawImage(img, img.width, img.height, false);
        resolve();
      };

      img.onerror = (error) => reject(error);

      img.src = URL.createObjectURL(image);
    });
  };

  const resetCanvas = () => {
    startCamera()
    drawPreviewRef.current = true
    setShowReset(false)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type.startsWith("image/")) {
        processPhoto(file)
      } else if(file.type.startsWith("video/")) {
        processVideo(file)
      } else {
        console.error("Unsupported file type:", file.type)
      }
    }
  }

  return (
    <div className="relative w-screen h-screen bg-black flex justify-center items-center overflow-hidden">
      <div className={`absolute w-full h-full transition-all ${showLoading ? "blur-md" : ""}`}>
        {/* Hidden Video Element */}
        <video ref={videoRef} autoPlay playsInline className="hidden" />

        {/* Canvas as the background */}
        <canvas ref={canvasRef} className="absolute w-full h-full object-cover" />
       
        {/* Settings Modal */}
        {showSettings && (
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-80">
            <div className="bg-white p-4 rounded-lg flex flex-col space-y-4">
              <p className="text-lg font-bold">Select Camera</p>
              <select
                className="px-4 py-2 rounded-md border border-gray-300"
                value={facingMode}
                onChange={(e) => {
                  setFacingMode(e.target.value as "user" | "environment")
                  setShowSettings(false)
                }}
              >
                {devices.map((device, index) => (
                  <option key={index} value={device.deviceId}>
                    {device.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>


              {/* Processor Selection Dropdown */}
              <p className="text-lg font-bold">Select Processor</p>
              <select
                className="px-4 py-2 rounded-md border border-gray-300"
                value={currentProcessor || ""}
                onChange={(e) => setCurrentProcessor(processors.find(p => p.name === e.target.value))}
              >
                {processors.map((processor, index) => (
                  <option key={index} value={processor.name}>
                    {processor.name}
                  </option>
                ))}
              </select>

              <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md" onClick={() => setShowSettings(false)}>
                Close
              </button>
            </div>
          </div>
        )}

        {/* UI Controls */}
        <div className="absolute bottom-5 w-full flex justify-center space-x-8">
          {/* Settings Button (Top-Right) */}
          <button
            className="absolute top-5 right-5 text-white text-2xl bg-gray-700 rounded-full p-2"
            onClick={() => setShowSettings(true)}
          >
            ⚙️
          </button>

          {/* Capture Photo or Reset Button (Bottom-Center) */}
          {!showReset ? (
            <>
              <button
                className="w-16 h-16 bg-white rounded-full border-4 border-gray-400"
                onClick={takePhoto}
              />
              <label className="w-14 h-14 flex items-center justify-center bg-white rounded-full border-4 border-gray-400 cursor-pointer">
                📷
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </>
          ) : (
            <button
              className="w-16 h-16 bg-white text-white rounded-full border-4 border-gray-400"
              onClick={resetCanvas}
            >
              🔄
            </button>
          )}
        </div>
      </div>
      {/* Loading Overlay */}
      {showLoading && (
        <div className="absolute w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  )
}