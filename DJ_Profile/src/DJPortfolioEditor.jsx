import { useState, useEffect, useRef } from "react";
import { Camera, Music, Banknote, Save, CheckCircle2 } from "lucide-react";

export function DJPortfolioEditor() {
  const fileInputRef = useRef(null);
  const [isSaved, setIsSaved] = useState(false);
  const availableGenres = ["House", "Techno", "Hip Hop", "EDM", "RnB", "Trance", "Amapiano", "Pop"];
  
  const [portfolio, setPortfolio] = useState({
    stageName: "DJ Pulse",
    hourlyRate: 800,
    bio: "Bringing the best energy to your private events.",
    genres: ["House", "Amapiano"],
    heroImage: null
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("gigzaDJPortfolio"));
    if (saved) setPortfolio(saved);
  }, []);

  const handleSave = () => {
    localStorage.setItem("gigzaDJPortfolio", JSON.stringify(portfolio));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const toggleGenre = (genre) => {
    const newGenres = portfolio.genres.includes(genre)
      ? portfolio.genres.filter(g => g !== genre)
      : [...portfolio.genres, genre];
    setPortfolio({ ...portfolio, genres: newGenres });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortfolio({ ...portfolio, heroImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-20 pb-24">
      <div className="max-w-2xl mx-auto px-6 space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">My Portfolio</h1>
            <p className="text-zinc-400">Manage your public profile and rates</p>
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-purple-500/25">
            {isSaved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
            {isSaved ? "Saved!" : "Save Profile"}
          </button>
        </div>

        {/* Image & Basic Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-700">
                {portfolio.heroImage ? (
                  <img src={portfolio.heroImage} alt="Hero" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-zinc-500" />
                )}
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
              <button onClick={() => fileInputRef.current.click()} className="absolute -bottom-2 -right-2 bg-purple-500 p-2 rounded-full border-2 border-black text-white">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <label className="text-zinc-400 text-sm mb-1 block">Stage Name</label>
              <input type="text" value={portfolio.stageName} onChange={(e) => setPortfolio({...portfolio, stageName: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block flex items-center gap-2"><Banknote className="w-4 h-4 text-green-400" /> Hourly Rate (ZAR)</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-zinc-500 font-bold">R</span>
              <input type="number" value={portfolio.hourlyRate} onChange={(e) => setPortfolio({...portfolio, hourlyRate: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-purple-500" />
            </div>
          </div>

          <div>
            <label className="text-zinc-400 text-sm mb-1 block">Bio</label>
            <textarea value={portfolio.bio} onChange={(e) => setPortfolio({...portfolio, bio: e.target.value})} className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 h-24 resize-none"></textarea>
          </div>
        </div>

        {/* Genres */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
          <label className="text-white font-bold mb-4 block flex items-center gap-2"><Music className="w-5 h-5 text-purple-400" /> My Genres</label>
          <div className="flex flex-wrap gap-2">
            {availableGenres.map(genre => (
              <button key={genre} onClick={() => toggleGenre(genre)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${portfolio.genres.includes(genre) ? "bg-purple-500 text-white" : "bg-black text-zinc-400 border border-zinc-700"}`}>
                {genre}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}