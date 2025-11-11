import AuthButton from "../auth/AuthButton";
import Silk from "../Silk";

export default function Hero() {
  return (
    <div className="w-full h-full min-h-screen">
    <div className="absolute top-0 left-0 w-full h-full">
      <Silk
        speed={5}
        scale={1}
        color="#5227ff"
        noiseIntensity={1.5}
        rotation={0}
        />
    </div>
    
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex-col-center">
        <h1 className="text-4xl font-bold text-center text-white font-nippo mb-6">Add <span>contxt</span> to your app.</h1>
        <AuthButton/>
    </div>
    </div>
  );
}