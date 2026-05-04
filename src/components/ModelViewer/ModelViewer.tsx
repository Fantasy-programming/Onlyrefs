import { useRef, useEffect, useState, memo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FiGrid, FiBox, FiRefreshCw } from 'react-icons/fi';

export interface ModelViewerProps {
  modelPath: string;
  className?: string;
  height?: number | string;
  showControls?: boolean;
}

export const ModelViewer = memo<ModelViewerProps>(
  ({ modelPath, className, height = 400, showControls = true }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const modelRef = useRef<THREE.Object3D | null>(null);
    const animationFrameRef = useRef<number>(0);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(true);
    const [showWireframe, setShowWireframe] = useState(false);

    // Initialize Three.js scene
    useEffect(() => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const width = container.clientWidth;
      const containerHeight =
        typeof height === 'number' ? height : container.clientHeight;

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1a1a1a);
      sceneRef.current = scene;

      // Camera
      const camera = new THREE.PerspectiveCamera(
        50,
        width / containerHeight,
        0.1,
        1000,
      );
      camera.position.set(5, 5, 5);
      cameraRef.current = camera;

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, containerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 1;
      controls.maxDistance = 100;
      controlsRef.current = controls;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 10);
      directionalLight.castShadow = true;
      scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight2.position.set(-5, 5, -5);
      scene.add(directionalLight2);

      // Grid helper
      const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x333333);
      gridHelper.name = 'grid';
      scene.add(gridHelper);

      // Animation loop
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Handle resize
      const handleResize = () => {
        if (!container || !camera || !renderer) return;
        const newWidth = container.clientWidth;
        const newHeight =
          typeof height === 'number' ? height : container.clientHeight;
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      };

      const resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);

      // Cleanup
      return () => {
        cancelAnimationFrame(animationFrameRef.current);
        resizeObserver.disconnect();
        controls.dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    }, [height]);

    // Load model
    useEffect(() => {
      if (!sceneRef.current || !modelPath) return;

      const scene = sceneRef.current;
      setIsLoading(true);
      setError(null);

      // Remove previous model
      if (modelRef.current) {
        scene.remove(modelRef.current);
        modelRef.current = null;
      }

      const extension = modelPath.split('.').pop()?.toLowerCase();

      const onLoadSuccess = (object: THREE.Object3D) => {
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the model
        object.position.sub(center);

        // Scale to fit in a reasonable size
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4 / maxDim;
        object.scale.multiplyScalar(scale);

        // Lift model to sit on grid
        const newBox = new THREE.Box3().setFromObject(object);
        object.position.y -= newBox.min.y;

        // Apply default material if none exists
        object.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (!child.material) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x808080,
                metalness: 0.3,
                roughness: 0.7,
              });
            }
          }
        });

        scene.add(object);
        modelRef.current = object;

        // Reset camera position
        if (cameraRef.current && controlsRef.current) {
          cameraRef.current.position.set(5, 5, 5);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }

        setIsLoading(false);
      };

      const onLoadError = (err: unknown) => {
        console.error('Failed to load model:', err);
        setError('Failed to load 3D model');
        setIsLoading(false);
      };

      // Load based on file type
      try {
        switch (extension) {
          case 'glb':
          case 'gltf': {
            const gltfLoader = new GLTFLoader();
            gltfLoader.load(
              modelPath,
              (gltf) => onLoadSuccess(gltf.scene),
              undefined,
              onLoadError,
            );
            break;
          }
          case 'obj': {
            const objLoader = new OBJLoader();
            objLoader.load(modelPath, onLoadSuccess, undefined, onLoadError);
            break;
          }
          case 'fbx': {
            const fbxLoader = new FBXLoader();
            fbxLoader.load(modelPath, onLoadSuccess, undefined, onLoadError);
            break;
          }
          case 'stl': {
            const stlLoader = new STLLoader();
            stlLoader.load(
              modelPath,
              (geometry) => {
                const material = new THREE.MeshStandardMaterial({
                  color: 0x808080,
                  metalness: 0.3,
                  roughness: 0.7,
                });
                const mesh = new THREE.Mesh(geometry, material);
                onLoadSuccess(mesh);
              },
              undefined,
              onLoadError,
            );
            break;
          }
          default:
            setError(`Unsupported file format: ${extension}`);
            setIsLoading(false);
        }
      } catch (err) {
        onLoadError(err);
      }
    }, [modelPath]);

    // Toggle grid visibility
    useEffect(() => {
      if (!sceneRef.current) return;
      const grid = sceneRef.current.getObjectByName('grid');
      if (grid) {
        grid.visible = showGrid;
      }
    }, [showGrid]);

    // Toggle wireframe
    useEffect(() => {
      if (!modelRef.current) return;
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.wireframe = showWireframe;
              }
            });
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.wireframe = showWireframe;
          }
        }
      });
    }, [showWireframe]);

    const handleResetView = () => {
      if (cameraRef.current && controlsRef.current) {
        cameraRef.current.position.set(5, 5, 5);
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    };

    return (
      <div
        className={cn('relative overflow-hidden rounded-xl', className)}
        style={{ height }}
      >
        <div ref={containerRef} className="h-full w-full" />

        {/* Loading overlay */}
        {isLoading && (
          <div className="bg-background/80 absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="border-primary h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
              <span className="text-muted-foreground text-sm">
                Loading model...
              </span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="bg-background/80 absolute inset-0 flex items-center justify-center">
            <div className="text-destructive text-center">
              <FiBox className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        {showControls && !isLoading && !error && (
          <div className="absolute bottom-2 left-2 flex gap-1">
            <Button
              variant={showGrid ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle grid"
            >
              <FiGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={showWireframe ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShowWireframe(!showWireframe)}
              title="Toggle wireframe"
            >
              <FiBox className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetView}
              title="Reset view"
            >
              <FiRefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  },
);

ModelViewer.displayName = 'ModelViewer';

export default ModelViewer;
