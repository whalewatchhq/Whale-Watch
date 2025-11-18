/*************************************************************
 *  WHALE WATCH INDONESIA - SUPABASE CLEAN PRODUCTION VERSION
 *  FULL CRUD, STORAGE, ADMIN PANEL, RENDERER, READTIME FIXED
 *************************************************************/

const SUPABASE_URL = "https://dtgamxtjzipqrosoobek.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0Z2FteHRqemlwcXJvc29vYmVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0NzA3OTksImV4cCI6MjA3OTA0Njc5OX0.dY8aBGQSrmzy3OjMI15m4uRZs8jRKcdoG4TwJ0qB2Lg";

const supabase = supabase_js.createClient(SUPABASE_URL, SUPABASE_KEY);
const { useState, useEffect } = React;

function WhaleWatchApp() {

  /************************************
   * REACT STATES
   ************************************/
  const [articles, setArticles] = useState([]);
  const [topNews, setTopNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedArticle, setSelectedArticle] = useState(null);

  const [showSubscribe, setShowSubscribe] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [currentUser] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    content: "",
    category: "CRYPTO",
    thumbnail: "",
    isTopNews: false
  });

  const categories = ["ALL", "REGULATION", "CRYPTO", "BITCOIN", "DeFi", "AI"];


  /************************************
   * LOAD ARTICLES FROM SUPABASE
   ************************************/
  const loadArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) throw error;

      setArticles(data);
      setTopNews(data.filter(a => a.isTopNews));
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);


  /************************************
   * UPLOAD THUMBNAIL TO STORAGE
   ************************************/
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `articles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("thumbnails")
      .upload(filePath, file);

    if (uploadError) {
      alert("Gagal upload thumbnail");
      console.error(uploadError);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("thumbnails")
      .getPublicUrl(filePath);

    setFormData({
      ...formData,
      thumbnail: publicUrl.publicUrl
    });
  };


  /************************************
   * INSERT / UPDATE ARTICLE
   ************************************/
  const handleFormSubmit = async () => {
    if (!formData.title || !formData.author || !formData.content || !formData.thumbnail) {
      alert("Semua field harus diisi!");
      return;
    }

    let payload = {
      title: formData.title,
      author: formData.author,
      content: formData.content,
      category: formData.category,
      thumbnail: formData.thumbnail,
      isTopNews: formData.isTopNews,
      date: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      Readtime: Math.ceil(formData.content.split(" ").length / 200) + " min read",
      timestamp: editingArticle ? editingArticle.timestamp : new Date()
    };

    let result;
    if (editingArticle) {
      result = await supabase
        .from("articles")
        .update(payload)
        .eq("id", editingArticle.id);
    } else {
      result = await supabase
        .from("articles")
        .insert([payload]);
    }

    if (result.error) {
      console.error(result.error);
      alert("Gagal menyimpan artikel");
      return;
    }

    resetForm();
    loadArticles();
  };


  /************************************
   * EDIT ARTICLE
   ************************************/
  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      author: article.author,
      content: article.content,
      category: article.category,
      thumbnail: article.thumbnail,
      isTopNews: article.isTopNews
    });
    setShowArticleForm(true);
  };


  /************************************
   * DELETE ARTICLE (SUPABASE)
   ************************************/
  const handleDelete = async (id) => {
    if (!confirm("Hapus artikel ini?")) return;

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id);

    if (error) return alert("Gagal menghapus artikel");

    loadArticles();
  };


  /************************************
   * RESET FORM
   ************************************/
  const resetForm = () => {
    setFormData({
      title: "",
      author: "",
      content: "",
      category: "CRYPTO",
      thumbnail: "",
      isTopNews: false
    });
    setEditingArticle(null);
    setShowArticleForm(false);
  };


  /************************************
   * SUBSCRIBE POPUP
   ************************************/
  const handleSubscribe = () => {
    if (!email) return alert("Masukkan email!");
    setSubscribeSuccess(true);
    setTimeout(() => {
      setShowSubscribe(false);
      setSubscribeSuccess(false);
      setEmail("");
    }, 1500);
  };


  /************************************
   * ADMIN LOGIN
   ************************************/
  const handleAdminLogin = () => {
    if (adminPassword === "admin123") {
      setIsAdmin(true);
      setShowAdminPanel(true);
      setShowLogin(false);
    } else {
      alert("Password salah!");
    }
  };


  /************************************
   * FILTER LIST
   ************************************/
  const filteredArticles =
    selectedCategory === "ALL"
      ? articles
      : articles.filter(a => a.category === selectedCategory);


  /************************************
   * RENDERING: LOADING SCREEN
   ************************************/
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div>
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-center mt-4 text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }


  /************************************
   * RENDER LOGIN SCREEN
   ************************************/
  if (showLogin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-zinc-900 p-8 rounded-lg max-w-md w-full">
          <h2 className="text-white text-2xl font-bold mb-4">Admin Login</h2>
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-zinc-800 px-4 py-3 rounded-lg outline-none mb-4"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAdminLogin()}
          />
          <button
            onClick={handleAdminLogin}
            className="w-full bg-cyan-400 text-black py-3 rounded-lg font-bold mb-2"
          >
            Login
          </button>
          <button
            onClick={() => setShowLogin(false)}
            className="w-full text-gray-400"
          >
            Batal
          </button>
        </div>
      </div>
    );
  }


  /************************************
   * RENDER ADMIN PANEL
   ************************************/
  if (showAdminPanel) {
    return (
      <div className="min-h-screen bg-black text-white">

        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowArticleForm(true)}
                className="bg-cyan-400 text-black px-4 py-2 rounded-lg"
              >
                + Artikel Baru
              </button>
              <button
                onClick={() => setShowAdminPanel(false)}
                className="bg-zinc-800 px-4 py-2 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h2 className="text-xl font-bold mb-2">Semua Artikel</h2>
          <div className="space-y-4">
            {articles.map((a) => (
              <div key={a.id} className="bg-zinc-900 rounded p-4 flex gap-4">
                <img
                  src={a.thumbnail}
                  className="w-32 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <span className="bg-cyan-400 text-black text-xs px-2 py-1 rounded">{a.category}</span>
                  {a.isTopNews && (
                    <span className="ml-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded">TOP</span>
                  )}
                  <h3 className="font-bold mt-2">{a.title}</h3>
                  <p className="text-xs text-gray-400">{a.author} • {a.date}</p>
                </div>

                <div className="flex flex-col gap-2">
  <button
    onClick={() => handleEdit(a)}
    className="bg-zinc-800 p-2 rounded hover:bg-zinc-700 transition"
  >
    <span className="iconify" data-icon="mdi:pencil-outline" style={{ fontSize: 20 }}></span>
  </button>

  <button
    onClick={() => handleDelete(a.id)}
    className="bg-red-900 p-2 rounded hover:bg-red-800 transition"
  >
    <span className="iconify" data-icon="mdi:trash-can-outline" style={{ fontSize: 20 }}></span>
  </button>
</div>
              </div>
            ))}
          </div>
        </div>

        {showArticleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-900 p-6 rounded-lg max-w-2xl w-full mt-12">

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {editingArticle ? "Edit Artikel" : "Artikel Baru"}
                </h2>
                <button onClick={resetForm} className="text-gray-400 text-3xl">×</button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Judul"
                  className="w-full bg-zinc-800 px-4 py-3 rounded-lg"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />

                <input
                  type="text"
                  placeholder="Penulis"
                  className="w-full bg-zinc-800 px-4 py-3 rounded-lg"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />

                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-zinc-800 px-4 py-3 rounded-lg"
                >
                  {categories.filter(c => c !== "ALL").map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full bg-zinc-800 px-4 py-3 rounded-lg"
                    onChange={handleImageUpload}
                  />
                  {formData.thumbnail && (
                    <img src={formData.thumbnail} className="w-full h-40 object-cover rounded mt-3" />
                  )}
                </div>

                <textarea
                  placeholder="Konten artikel..."
                  className="w-full bg-zinc-800 px-4 py-3 rounded-lg min-h-[200px]"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />

                <label className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={formData.isTopNews}
                    onChange={(e) => setFormData({ ...formData, isTopNews: e.target.checked })}
                  />
                  Jadikan Top News
                </label>

                <button
                  onClick={handleFormSubmit}
                  className="w-full bg-cyan-400 text-black font-bold py-3 rounded-lg"
                >
                  {editingArticle ? "Update" : "Publish"}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    );
  }


  /************************************
   * ARTICLE DETAIL VIEW
   ************************************/
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-black text-white">

        <div className="sticky top-0 bg-zinc-900 p-4 border-b border-zinc-800">
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-cyan-400 flex items-center gap-2"
          >
            ← Kembali
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-4">
          <img src={selectedArticle.thumbnail} className="w-full h-64 object-cover rounded mb-4" />

          <span className="bg-cyan-400 text-black text-xs px-2 py-1 rounded">
            {selectedArticle.category}
          </span>

          <h1 className="text-3xl font-bold mt-3 mb-4">
            {selectedArticle.title}
          </h1>

        <div className="flex gap-4 text-gray-400 text-sm mb-6">
  <span className="flex items-center gap-1">
    <span className="iconify" data-icon="mdi:calendar-month-outline" style={{fontSize:16}}></span>
    {selectedArticle.date}
  </span>

  <span className="flex items-center gap-1">
    <span className="iconify" data-icon="mdi:account-edit-outline" style={{fontSize:16}}></span>
    {selectedArticle.author}
  </span>

  <span className="flex items-center gap-1">
    <span className="iconify" data-icon="mdi:timer-outline" style={{fontSize:16}}></span>
    {selectedArticle.Readtime}
  </span>
</div>

          <div className="text-gray-300 leading-relaxed">
            {selectedArticle.content.split("\n\n").map((p, i) => (
              <p key={i} className="mb-4">{p}</p>
            ))}
          </div>

        </div>

      </div>
    );
  }


  /************************************
   * HOME — LIST VIEW
   ************************************/
  return (
    <div className="min-h-screen bg-black text-white pb-20">

      <div className="sticky top-0 bg-zinc-900 p-4 border-b border-zinc-800">
        <div className="flex justify-between items-center mb-4">

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-cyan-400 flex items-center justify-center">
  <img 
    src="https://dtgamxtjzipqrosoobek.supabase.co/storage/v1/object/sign/Branding/whalewatch-logo.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82NTc5NWExOC1hOWRlLTQxYTEtYTI5NS0zM2FlYjlhNzVkMTYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJCcmFuZGluZy93aGFsZXdhdGNoLWxvZ28ucG5nIiwiaWF0IjoxNzYzNDc1NjQ1LCJleHAiOjE3OTUwMTE2NDV9.SuiCmSNdspXZD7U6U8ivQnVI0zhOGQ78p_vvqmesjzM"
    alt="Whale Watch Logo"
    className="w-full h-full object-cover"
  />
</div>
            <div>
              <h1 className="text-xl font-bold">Whale Watch</h1>
              <p className="text-xs text-gray-400">Indonesia</p>
            </div>
          </div>

          {!isAdmin && (
            <button
              onClick={() => setShowLogin(true)}
              className="p-2 rounded bg-zinc-800"
            >
              ☰
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-2 rounded-full text-sm ${
                selectedCategory === c
                  ? "bg-cyan-400 text-black"
                  : "bg-zinc-800 text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

      </div>

      {topNews.length > 0 && (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-2">TOP NEWS</h2>
          <div className="space-y-4">
            {topNews.map((t) => (
              <div
                key={t.id}
                className="rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedArticle(t)}
              >
                <img
                  src={t.thumbnail}
                  className="w-full h-56 object-cover"
                />
                <div className="p-3 bg-zinc-900">
                  <span className="bg-cyan-400 text-black text-xs px-2 py-1 rounded">
                    {t.category}
                  </span>
                  <h3 className="text-xl font-bold mt-2">{t.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">ALL NEWS</h2>

        {filteredArticles.length === 0 ? (
          <p className="text-center text-gray-500">Belum ada artikel</p>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((a) => (
              <div
                key={a.id}
                onClick={() => setSelectedArticle(a)}
                className="bg-zinc-900 rounded p-3 cursor-pointer hover:bg-zinc-800"
              >
                <div className="flex gap-3">
                  <img src={a.thumbnail} className="w-28 h-20 object-cover rounded" />

                  <div>
                    <span className="bg-cyan-400 text-black text-xs px-2 py-1 rounded">
                      {a.category}
                    </span>
                    <h3 className="font-bold mt-2 line-clamp-2">{a.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {a.author} • {a.Readtime}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}

/************************************
 * RENDER APP
 ************************************/
ReactDOM.render(<WhaleWatchApp />, document.getElementById("root"));