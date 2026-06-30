import React, { useState, useRef, useEffect } from "react";
import {
  Image as ImageIcon,
  Plus,
  ChevronRight,
  FileText,
  Video,
} from "lucide-react";
import VendorLayout from "../../components/vendor/VendorLayout";
import "./AddProduct.css";
import { useNavigate, useParams } from "react-router-dom";
import {
  addProduct,
  getProduct,
  updateProduct,
  searchProducts,
  getCategories,
  getSubCategories,
  BACKEND_URL,
  PLACEHOLDER_IMG,
} from "../../api/api";
import toast from "react-hot-toast";

const AddProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Basic Info State
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("single");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [sku, setSku] = useState("");
  const [productStatus, setProductStatus] = useState("in");

  const [regularPrice, setRegularPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [initialStock, setInitialStock] = useState("");
  const [supportsWholesale, setSupportsWholesale] = useState(false);
  const [wholesaleOnly, setWholesaleOnly] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [minimumWholesaleQuantity, setMinimumWholesaleQuantity] = useState("10");
  const [wholesaleDiscountType, setWholesaleDiscountType] =
    useState("percentage");
  // Bulk/Tiered Pricing State
  const [pricingTiers, setPricingTiers] = useState([]);

  const handleAddPricingTier = () => {
    setPricingTiers(prev => [...prev, { minQuantity: "", maxQuantity: "", unitPrice: "", discountType: "percentage", discountValue: "" }]);
  };

  const handleRemovePricingTier = (index) => {
    setPricingTiers(prev => prev.filter((_, i) => i !== index));
  };

  const handlePricingTierChange = (index, field, value) => {
    setPricingTiers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const [mediaFiles, setMediaFiles] = useState([]);
  const [manufacturerLayout, setManufacturerLayout] = useState("collage");
  const [submitError, setSubmitError] = useState("");
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [attributes, setAttributes] = useState([{ name: "", value: "" }]);
  const [variations, setVariations] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // Category dropdown state
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [subCategorySearch, setSubCategorySearch] = useState("");
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const categoryDropdownRef = useRef(null);
  const subCategoryDropdownRef = useRef(null);

  // Linked Products State
  const [upsells, setUpsells] = useState([]);
  const [upsellInput, setUpsellInput] = useState("");
  const [upsellSuggestions, setUpsellSuggestions] = useState([]);
  const [showUpsellDropdown, setShowUpsellDropdown] = useState(false);
  const [crossSells, setCrossSells] = useState([]);
  const [crossSellInput, setCrossSellInput] = useState("");
  const [crossSellSuggestions, setCrossSellSuggestions] = useState([]);
  const [showCrossSellDropdown, setShowCrossSellDropdown] = useState(false);
  const [boughtTogether, setBoughtTogether] = useState([]);
  const [boughtTogetherInput, setBoughtTogetherInput] = useState("");
  const [boughtTogetherSuggestions, setBoughtTogetherSuggestions] = useState([]);
  const [showBoughtTogetherDropdown, setShowBoughtTogetherDropdown] = useState(false);
  const upsellDebounceRef = useRef(null);
  const crossSellDebounceRef = useRef(null);
  const boughtTogetherDebounceRef = useRef(null);
  const upsellDropdownRef = useRef(null);
  const crossSellDropdownRef = useRef(null);
  const boughtTogetherDropdownRef = useRef(null);
  const instagramProductInputRefs = useRef({});
  const instagramProductDebounceRef = useRef(null);

  // Shipping, Tax & Policies State
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");


  // Policy Documents State
  const [policyDocuments, setPolicyDocuments] = useState([]);
  const policyFileInputRef = useRef(null);

  const [manufacturerMedia, setManufacturerMedia] = useState([]);
  const mfrFileInputRef = useRef(null);

  const [videoUrls, setVideoUrls] = useState([]);
  const [videoUrlInput, setVideoUrlInput] = useState("");
  const [instagramUrls, setInstagramUrls] = useState([]);
  const [instagramUrlInput, setInstagramUrlInput] = useState("");
  const [instagramFeedLayout, setInstagramFeedLayout] = useState("slider");
  const [instagramProductLinks, setInstagramProductLinks] = useState({});
  const [instagramThumbnails, setInstagramThumbnails] = useState({});
  const [instagramProductInput, setInstagramProductInput] = useState("");
  const [instagramProductSuggestions, setInstagramProductSuggestions] = useState([]);
  const [showInstagramProductDropdown, setShowInstagramProductDropdown] = useState(false);
  const [activeInstagramProductIndex, setActiveInstagramProductIndex] = useState(null);

  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        isNew: true,
        mediaType: "gallery",
      }));
      setMediaFiles((prev) => [...prev, ...newFiles]);
      if (errors.media) setErrors(prev => ({ ...prev, media: "" }));
    }
  };

  const handlePolicyDocumentChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => {
        // Default title is filename without extension
        const nameWithoutExt =
          file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        return {
          file,
          name: file.name,
          title: nameWithoutExt,
          url: URL.createObjectURL(file),
        };
      });
      setPolicyDocuments((prev) => [...prev, ...newFiles]);
    }
  };

  const handlePolicyTitleChange = (index, newTitle) => {
    const updatedDocs = [...policyDocuments];
    updatedDocs[index].title = newTitle;
    setPolicyDocuments(updatedDocs);
  };

  const removePolicyDocument = (index) => {
    setPolicyDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        isNew: true,
        mediaType: "gallery",
      }));
      setMediaFiles((prev) => [...prev, ...newFiles]);
      if (errors.media) setErrors(prev => ({ ...prev, media: "" }));
    }
  };

  const setPrimary = (index) => {
    if (index === 0) return;
    setMediaFiles((prev) => {
      const copy = [...prev];
      const item = copy.splice(index, 1)[0];
      copy.unshift(item);
      return copy;
    });
  };

  const removeMedia = (index, e) => {
    if (e) {
      e.stopPropagation();
    }
    setMediaFiles((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].url);
      copy.splice(index, 1);
      return copy;
    });
  };

  const handleAddAttribute = () => {
    setAttributes([...attributes, { name: "", value: "" }]);
  };

  const handleRemoveAttribute = (index) => {
    const newAttrs = [...attributes];
    newAttrs.splice(index, 1);
    setAttributes(newAttrs);
  };

  const handleAttributeChange = (index, field, value) => {
    const newAttrs = [...attributes];
    newAttrs[index][field] = value;
    setAttributes(newAttrs);
  };

  const handleAddVariation = () => {
    setVariations([
      ...variations,
      {
        name: "",
        sku: "",
        price: "",
        stock: "",
        useMainPricing: true,
        useMainAttributesAndTags: true,
        images: [],
        attributes: [{ name: "", value: "" }],
        tags: [],
        tagInput: ""
      },
    ]);
  };

  const handleRemoveVariation = (index) => {
    const newVars = [...variations];
    newVars.splice(index, 1);
    setVariations(newVars);
  };

  const handleVariationChange = (index, field, value) => {
    const newVars = [...variations];
    newVars[index][field] = value;
    setVariations(newVars);
  };

  const handleVariationFileChange = (index, e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        isNew: true,
      }));
      setVariations((prev) => {
        const newVars = [...prev];
        const currentImages = newVars[index].images || [];
        newVars[index].images = [...currentImages, ...newFiles];
        return newVars;
      });
    }
    e.target.value = "";
  };

  const setVariationPrimary = (varIndex, imgIndex) => {
    if (imgIndex === 0) return;
    setVariations((prev) => {
      const newVars = [...prev];
      const newImages = [...(newVars[varIndex].images || [])];
      const item = newImages.splice(imgIndex, 1)[0];
      newImages.unshift(item);
      newVars[varIndex].images = newImages;
      return newVars;
    });
  };

  const removeVariationMedia = (varIndex, imgIndex, e) => {
    if (e) e.stopPropagation();
    const newVars = [...variations];
    const newImages = [...(newVars[varIndex].images || [])];
    if (newImages[imgIndex]) {
      URL.revokeObjectURL(newImages[imgIndex].url);
      newImages.splice(imgIndex, 1);
      newVars[varIndex].images = newImages;
      setVariations(newVars);
    }
  };

  const handleAddVariationAttribute = (varIndex) => {
    const newVars = [...variations];
    const currentAttrs = newVars[varIndex].attributes || [];
    newVars[varIndex].attributes = [...currentAttrs, { name: "", value: "" }];
    setVariations(newVars);
  };

  const handleRemoveVariationAttribute = (varIndex, attrIndex) => {
    const newVars = [...variations];
    const currentAttrs = [...(newVars[varIndex].attributes || [])];
    currentAttrs.splice(attrIndex, 1);
    newVars[varIndex].attributes = currentAttrs;
    setVariations(newVars);
  };

  const handleVariationAttributeChange = (varIndex, attrIndex, field, value) => {
    const newVars = [...variations];
    if (!newVars[varIndex].attributes) newVars[varIndex].attributes = [];
    newVars[varIndex].attributes[attrIndex][field] = value;
    setVariations(newVars);
  };

  const handleAddVariationTag = (varIndex, e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmedTag = (variations[varIndex].tagInput || "").trim();
      const currentTags = variations[varIndex].tags || [];
      if (trimmedTag && !currentTags.includes(trimmedTag)) {
        const newVars = [...variations];
        newVars[varIndex].tags = [...currentTags, trimmedTag];
        newVars[varIndex].tagInput = "";
        setVariations(newVars);
      }
    }
  };

  const handleRemoveVariationTag = (varIndex, tagToRemove) => {
    const newVars = [...variations];
    const currentTags = newVars[varIndex].tags || [];
    newVars[varIndex].tags = currentTags.filter((tag) => tag !== tagToRemove);
    setVariations(newVars);
  };

  const handleAddTag = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmedTag = tagInput.trim();
      if (trimmedTag && !tags.includes(trimmedTag)) {
        setTags([...tags, trimmedTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleInstagramProductInputChange = (index, value) => {
    setInstagramProductInput(value);
    setActiveInstagramProductIndex(index);
    clearTimeout(instagramProductDebounceRef.current);
    instagramProductDebounceRef.current = setTimeout(() => {
      fetchProductSuggestions(value, setInstagramProductSuggestions, setShowInstagramProductDropdown);
    }, 300);
  };

  const handleSelectInstagramProduct = (index, product) => {
    const name = product.name || product.productName;
    setInstagramProductLinks(prev => ({...prev, [index]: name}));
    setInstagramProductInput("");
    setInstagramProductSuggestions([]);
    setShowInstagramProductDropdown(false);
    setActiveInstagramProductIndex(null);
  };

  const handleRemoveInstagramProductLink = (index) => {
    setInstagramProductLinks(prev => {
      const next = {...prev};
      delete next[index];
      return next;
    });
  };

  // Linked Products Handlers
  const fetchProductSuggestions = async (query, setSuggestions, setShowDropdown) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    try {
      const results = await searchProducts(query.trim());
      const products = Array.isArray(results) ? results : results?.content || [];
      setSuggestions(products);
      setShowDropdown(products.length > 0);
    } catch {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleUpsellInputChange = (e) => {
    const value = e.target.value;
    setUpsellInput(value);
    clearTimeout(upsellDebounceRef.current);
    upsellDebounceRef.current = setTimeout(() => {
      fetchProductSuggestions(value, setUpsellSuggestions, setShowUpsellDropdown);
    }, 300);
  };

  const handleCrossSellInputChange = (e) => {
    const value = e.target.value;
    setCrossSellInput(value);
    clearTimeout(crossSellDebounceRef.current);
    crossSellDebounceRef.current = setTimeout(() => {
      fetchProductSuggestions(value, setCrossSellSuggestions, setShowCrossSellDropdown);
    }, 300);
  };

  const handleSelectUpsell = (product) => {
    const name = product.name || product.productName;
    if (name && !upsells.includes(name)) {
      setUpsells([...upsells, name]);
    }
    setUpsellInput("");
    setUpsellSuggestions([]);
    setShowUpsellDropdown(false);
  };

  const handleSelectCrossSell = (product) => {
    const name = product.name || product.productName;
    if (name && !crossSells.includes(name)) {
      setCrossSells([...crossSells, name]);
    }
    setCrossSellInput("");
    setCrossSellSuggestions([]);
    setShowCrossSellDropdown(false);
  };

  const handleAddUpsell = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = upsellInput.trim();
      if (trimmed && !upsells.includes(trimmed)) {
        setUpsells([...upsells, trimmed]);
      }
      setUpsellInput("");
      setShowUpsellDropdown(false);
    }
  };

  const handleRemoveUpsell = (itemToRemove) => {
    setUpsells(upsells.filter((item) => item !== itemToRemove));
  };

  const handleAddCrossSell = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = crossSellInput.trim();
      if (trimmed && !crossSells.includes(trimmed)) {
        setCrossSells([...crossSells, trimmed]);
      }
      setCrossSellInput("");
      setShowCrossSellDropdown(false);
    }
  };

  const handleRemoveCrossSell = (itemToRemove) => {
    setCrossSells(crossSells.filter((item) => item !== itemToRemove));
  };

  const handleBoughtTogetherInputChange = (e) => {
    const value = e.target.value;
    setBoughtTogetherInput(value);
    clearTimeout(boughtTogetherDebounceRef.current);
    boughtTogetherDebounceRef.current = setTimeout(() => {
      fetchProductSuggestions(value, setBoughtTogetherSuggestions, setShowBoughtTogetherDropdown);
    }, 300);
  };

  const handleSelectBoughtTogether = (product) => {
    const name = product.name || product.productName;
    if (name && !boughtTogether.includes(name)) {
      setBoughtTogether([...boughtTogether, name]);
    }
    setBoughtTogetherInput("");
    setBoughtTogetherSuggestions([]);
    setShowBoughtTogetherDropdown(false);
  };

  const handleAddBoughtTogether = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = boughtTogetherInput.trim();
      if (trimmed && !boughtTogether.includes(trimmed)) {
        setBoughtTogether([...boughtTogether, trimmed]);
      }
      setBoughtTogetherInput("");
      setShowBoughtTogetherDropdown(false);
    }
  };

  const handleRemoveBoughtTogether = (itemToRemove) => {
    setBoughtTogether(boughtTogether.filter((item) => item !== itemToRemove));
  };

  const handleMfrFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        type: "image",
        isNew: true,
      }));
      setManufacturerMedia((prev) => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const handleAddInstagramUrl = () => {
    const url = instagramUrlInput.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid Instagram URL starting with http:// or https://");
      return;
    }
    if (!url.includes("instagram.com")) {
      toast.error("Please enter a valid Instagram post URL");
      return;
    }
    setInstagramUrls((prev) => [...prev, url]);
    setInstagramUrlInput("");
  };

  const handleRemoveInstagramUrl = (index) => {
    setInstagramUrls((prev) => prev.filter((_, i) => i !== index));
    setInstagramProductLinks((prev) => {
      const next = { ...prev };
      delete next[index];
      const reIndexed = {};
      Object.keys(next).forEach((key) => {
        const k = parseInt(key);
        if (k > index) reIndexed[k - 1] = next[k];
        else reIndexed[k] = next[k];
      });
      return reIndexed;
    });
    setInstagramThumbnails((prev) => {
      const next = { ...prev };
      delete next[index];
      const reIndexed = {};
      Object.keys(next).forEach((key) => {
        const k = parseInt(key);
        if (k > index) reIndexed[k - 1] = next[k];
        else reIndexed[k] = next[k];
      });
      return reIndexed;
    });
  };

  const handleInstagramThumbnail = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setInstagramThumbnails((prev) => ({
        ...prev,
        [index]: { file, preview: e.target.result },
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeInstagramThumbnail = (index) => {
    setInstagramThumbnails((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleAddVideoUrl = () => {
    const url = videoUrlInput.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("Please enter a valid video URL starting with http:// or https://");
      return;
    }
    setVideoUrls((prev) => [...prev, url]);
    setVideoUrlInput("");
  };

  const handleRemoveVideoUrl = (index) => {
    setVideoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Close dropdowns on outside click
  // Fetch categories and subcategories on mount
  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const [cats, subCats] = await Promise.all([
          getCategories(),
          getSubCategories(),
        ]);
        setCategories(Array.isArray(cats) ? cats : []);
        setSubCategories(Array.isArray(subCats) ? subCats : []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategoryData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (upsellDropdownRef.current && !upsellDropdownRef.current.contains(e.target)) {
        setShowUpsellDropdown(false);
      }
      if (crossSellDropdownRef.current && !crossSellDropdownRef.current.contains(e.target)) {
        setShowCrossSellDropdown(false);
      }
      if (boughtTogetherDropdownRef.current && !boughtTogetherDropdownRef.current.contains(e.target)) {
        setShowBoughtTogetherDropdown(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setShowCategoryDropdown(false);
      }
      if (subCategoryDropdownRef.current && !subCategoryDropdownRef.current.contains(e.target)) {
        setShowSubCategoryDropdown(false);
      }
      if (activeInstagramProductIndex !== null) {
        const ref = instagramProductInputRefs.current[activeInstagramProductIndex];
        if (ref && !ref.contains(e.target)) {
          setShowInstagramProductDropdown(false);
          setActiveInstagramProductIndex(null);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleThumbnailDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Give a slight delay before making it transparent visually if needed
    setTimeout(() => {
      if (e.target.style) {
        e.target.style.opacity = "0.5";
      }
    }, 0);
  };

  const handleThumbnailDragEnter = (e, index) => {
    e.preventDefault();
    const draggedIndex = draggedItemIndex;
    if (draggedIndex === null || draggedIndex === index) {
      return; // Don't do anything if not dragging or over itself
    }

    // Reorder
    setMediaFiles((prev) => {
      const newFiles = [...prev];
      const item = newFiles[draggedIndex];
      newFiles.splice(draggedIndex, 1);
      newFiles.splice(index, 0, item);
      return newFiles;
    });

    // Update the dragged index to the new position
    setDraggedItemIndex(index);
  };

  const handleThumbnailDragEnd = (e) => {
    setDraggedItemIndex(null);
    if (e.target.style) {
      e.target.style.opacity = "1";
    }
  };

  const handleThumbnailDragOver = (e) => {
    e.preventDefault();
  };

  // --- Fetch Existing Product Data on Mount ---
  React.useEffect(() => {
    if (isEditMode) {
      const fetchExistingProduct = async () => {
        try {
          const data = await getProduct(id);
          setProductName(data.name || "");
          setProductType(data.type || "single");
          setCategory(data.category || "");
          setCategorySearch(data.category || "");
          setSubCategory(data.subCategory || "");
          setSubCategorySearch(data.subCategory || "");
          setBrand(data.brand || "");
          setShortDescription(data.shortDescription || "");
          setDescription(data.description || "");
          setMetaTitle(data.metaTitle || "");
          setMetaDescription(data.metaDescription || "");
          setSku(data.sku || "");
          setProductStatus(data.status || "in");

          setRegularPrice(data.regularPrice?.toString() || "");
          setDiscountPrice(data.discountPrice?.toString() || "");
          setInitialStock(data.initialStock?.toString() || "");
          setSupportsWholesale(data.supportsWholesale || false);
          setWholesaleOnly(data.wholesaleOnly || false);
          setWholesalePrice(data.wholesalePrice || "");
          setMinimumWholesaleQuantity(data.minimumWholesaleQuantity || "10");
          setWholesaleDiscountType(data.wholesaleDiscountType || "percentage");

          if (data.pricingTiers && data.pricingTiers.length > 0) {
            setPricingTiers(data.pricingTiers.map(t => ({
              minQuantity: t.minQuantity?.toString() || "",
              maxQuantity: t.maxQuantity?.toString() || "",
              unitPrice: t.unitPrice?.toString() || "",
              discountType: t.discountType || "percentage",
              discountValue: t.discountValue?.toString() || "",
            })));
          }

          setWeight(data.weight?.toString() || "");
          setLength(data.length?.toString() || "");
          setWidth(data.width?.toString() || "");
          setHeight(data.height?.toString() || "");


          if (data.attributes) setAttributes(data.attributes);
          if (data.variations) {
            setVariations(data.variations.map((v) => ({
              ...v,
              images: v.imageFileName
                ? [{
                    isNew: false,
                    url: `${BACKEND_URL}/uploads/products/${v.imageFileName}`,
                    type: "image",
                  }]
                : [],
            })));
          }
          if (data.tags) setTags(data.tags.map((t) => t.name));

          if (data.linkedProducts) {
            setUpsells(
              data.linkedProducts
                .filter((lp) => lp.linkedType === "UPSELL")
                .map((lp) => lp.linkedProductName)
            );
            setCrossSells(
              data.linkedProducts
                .filter((lp) => lp.linkedType === "CROSS_SELL")
                .map((lp) => lp.linkedProductName)
            );
            setBoughtTogether(
              data.linkedProducts
                .filter((lp) => lp.linkedType === "BOUGHT_TOGETHER")
                .map((lp) => lp.linkedProductName)
            );
          }

          if (data.media) {
            const galleryMedia = data.media.filter(m => m.fileName && m.mediaType !== 'manufacturer' && m.fileType !== 'video-url' && m.fileType !== 'instagram-url').map((m) => ({
              isNew: false,
              id: m.id,
              url: `${BACKEND_URL}/uploads/products/${m.fileName}`,
              type: m.fileType,
              isPrimary: m.isPrimary,
              mediaType: m.mediaType || "gallery",
            }));
            galleryMedia.sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
            setMediaFiles(galleryMedia);

            const mfrMedia = data.media.filter(m => m.fileName && m.mediaType === 'manufacturer').map((m) => ({
              id: m.id,
              url: `${BACKEND_URL}/uploads/products/${m.fileName}`,
              type: "image",
              isNew: false,
            }));
            setManufacturerMedia(mfrMedia);

            const instagramMediaItems = data.media.filter(m => m.fileName && m.fileType === 'instagram-url');
            const instaUrls = instagramMediaItems.map(m => m.fileName);
            setInstagramUrls(instaUrls);
            const loadedThumbnails = {};
            instagramMediaItems.forEach((m, idx) => {
              if (m.customThumbnail) {
                loadedThumbnails[idx] = {
                  file: null,
                  preview: `${BACKEND_URL}/uploads/products/${m.customThumbnail}`
                };
              }
            });
            if (Object.keys(loadedThumbnails).length > 0) {
              setInstagramThumbnails(loadedThumbnails);
            }

            const videoUrlsData = data.media
              .filter(m => m.fileName && m.fileType === 'video-url')
              .map(m => m.fileName);
            setVideoUrls(videoUrlsData);
          }
          if (data.instagramFeedLayout) {
            setInstagramFeedLayout(data.instagramFeedLayout);
          }
          if (data.instagramFeedConfig) {
            try {
              const config = JSON.parse(data.instagramFeedConfig);
              if (config.links) setInstagramProductLinks(config.links);
            } catch (e) {}
          }
          if (data.manufacturerLayout) {
            setManufacturerLayout(data.manufacturerLayout);
          }
        } catch (error) {
          console.error("Failed to load product data", error);
          toast.error("Failed to load product data");
        }
      };
      fetchExistingProduct();
    }
  }, [id, isEditMode]);

  const handleSaveProduct = async () => {
    if (!validateForm()) {
      setSubmitError("Please fix the errors before saving.");
      toast.error("Please fill all required fields correctly.");
      return;
    }

    setSubmitError("");

    try {
      const productData = {
        name: productName,
        type: productType,
        category: category,
        subCategory: subCategory,
        brand: brand,
        shortDescription: shortDescription,
        description: description,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        regularPrice: parseFloat(regularPrice) || 0,
        discountPrice: parseFloat(discountPrice) || null,
        sku: sku,
        initialStock: parseInt(initialStock) || 0,
        supportsWholesale: supportsWholesale,
        wholesaleOnly: wholesaleOnly,
        wholesaleDiscountType: wholesaleDiscountType,
        wholesalePrice: wholesalePrice ? parseFloat(wholesalePrice) : null,
        minimumWholesaleQuantity: minimumWholesaleQuantity ? parseInt(minimumWholesaleQuantity) : null,
        pricingTiers: pricingTiers
          .filter(t => t.minQuantity !== "")
          .map(t => ({
            minQuantity: parseInt(t.minQuantity),
            maxQuantity: t.maxQuantity ? parseInt(t.maxQuantity) : null,
            unitPrice: t.unitPrice ? parseFloat(t.unitPrice) : null,
            discountType: t.discountType || null,
            discountValue: t.discountValue ? parseFloat(t.discountValue) : null,
          })),
        weight: parseFloat(weight) || null,
        length: parseFloat(length) || null,
        width: parseFloat(width) || null,
        height: parseFloat(height) || null,

        status: isEditMode ? productStatus : "in",

        attributes: attributes
          .filter((a) => a.name && a.value)
          .map((a) => ({ name: a.name, value: a.value })),
        tags: tags.map((t) => ({ name: t })),
        variations: variations
          .filter((v) => v.name)
          .map((v) => {
            // Preserve existing imageFileName for non-new images
            const existingImage = (v.images || []).find((img) => !img.isNew);
            const existingImageFileName = existingImage
              ? (v.imageFileName || null)
              : null;
            // If there are new images, the backend will overwrite imageFileName
            return {
              name: v.name,
              sku: v.sku,
              price: parseFloat(v.price) || null,
              stock: parseInt(v.stock) || 0,
              useMainPricing: v.useMainPricing,
              useMainAttributesAndTags: v.useMainAttributesAndTags !== false,
              imageFileName: existingImageFileName,
              attributes: v.useMainAttributesAndTags !== false ? [] : (v.attributes || []).filter((a) => a.name && a.value).map((a) => ({ name: a.name, value: a.value })),
              tags: v.useMainAttributesAndTags !== false ? [] : (v.tags || []).map((t) => ({ name: t })),
            };
          }),
        linkedProducts: [
          ...upsells.map((u) => ({
            linkedType: "UPSELL",
            linkedProductName: u,
          })),
          ...crossSells.map((c) => ({
            linkedType: "CROSS_SELL",
            linkedProductName: c,
          })),
          ...boughtTogether.map((b) => ({
            linkedType: "BOUGHT_TOGETHER",
            linkedProductName: b,
          })),
        ],
        media: mediaFiles.map((m, index) => ({
          id: m.isNew ? null : m.id,
          isNew: m.isNew,
          isPrimary: index === 0,
          mediaType: m.mediaType || "gallery",
        })),
        manufacturerLayout: manufacturerLayout,
        instagramFeedLayout: instagramFeedLayout,
        instagramFeedConfig: Object.keys(instagramProductLinks).length > 0
          ? JSON.stringify({ links: instagramProductLinks })
          : null,
      };

      const formData = new FormData();
      formData.append("product", JSON.stringify(productData));

      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userObj = JSON.parse(userStr);
        if (userObj.userId) {
          formData.append("vendorId", userObj.userId);
        }
      }

      mediaFiles.forEach((media) => {
        if (media.isNew && media.file) {
          formData.append("mediaFiles", media.file);
        }
      });

      manufacturerMedia.forEach((media) => {
        if (media.isNew && media.file) {
          formData.append("manufacturerFiles", media.file);
        }
      });

      let filteredVarIndex = 0;
      variations.forEach((varItem) => {
        if (!varItem.name) return;
        if (varItem.images) {
          const variationMediaMetadata = [];
          varItem.images.forEach((media, imgIndex) => {
            if (media.isNew && media.file) {
              formData.append(`variationMedia_${filteredVarIndex}`, media.file);
            }
            variationMediaMetadata.push({
              isNew: media.isNew,
              isPrimary: imgIndex === 0,
            });
          });
          formData.append(`variationMediaMetadata_${filteredVarIndex}`, JSON.stringify(variationMediaMetadata));
        }
        filteredVarIndex++;
      });

      policyDocuments.forEach((doc) => {
        if (doc.file) {
          formData.append("policyFiles", doc.file);
        }
      });

      const existingMfrIds = manufacturerMedia.filter(m => !m.isNew).map(m => m.id);
      if (existingMfrIds.length > 0) {
        formData.append("manufacturerMediaIds", JSON.stringify(existingMfrIds));
      }

      if (videoUrls.length > 0) {
        formData.append("videoUrls", JSON.stringify(videoUrls));
      }

      if (instagramUrls.length > 0) {
        formData.append("instagramUrls", JSON.stringify(instagramUrls));
        const thumbFiles = Object.entries(instagramThumbnails)
          .filter(([, v]) => v.file)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([, v]) => v.file);
        if (thumbFiles.length > 0) {
          thumbFiles.forEach((file) => formData.append("instagramThumbnailFiles", file));
          formData.append("instagramThumbnailIndices", JSON.stringify(
            Object.entries(instagramThumbnails)
              .filter(([, v]) => v.file)
              .map(([k]) => parseInt(k))
          ));
        }
      }

      const loadingToast = toast.loading(
        isEditMode ? "Updating product..." : "Saving product...",
      );

      if (isEditMode) {
        await updateProduct(id, formData);
        toast.dismiss(loadingToast);
        toast.success("Product updated successfully!");
      } else {
        await addProduct(formData);
        toast.dismiss(loadingToast);
        toast.success("Product saved successfully!");
      }

      navigate("/vendor/products");
    } catch (error) {
      toast.error(error.message || "Failed to save product");
      setSubmitError(error.message || "Failed to save product");
    }
  };

  const handleInitialStockChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      setInitialStock("");
      return;
    }
    const num = parseInt(val, 10);
    if (num < 0) {
      setInitialStock("0");
    } else {
      setInitialStock(num.toString());
    }
  };

  const handleRegularPriceChange = (e) => {
    const val = e.target.value;
    setRegularPrice(val);
    if (errors.regularPrice) {
      setErrors(prev => ({ ...prev, regularPrice: "" }));
    }
    validatePrices(val, discountPrice);
  };

  const handleDiscountPriceChange = (e) => {
    const val = e.target.value;
    setDiscountPrice(val);
    validatePrices(regularPrice, val);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!productName.trim()) newErrors.productName = "Product name is required";
    if (!category) newErrors.category = "Category is required";
    if (!regularPrice || parseFloat(regularPrice) <= 0) {
      newErrors.regularPrice = "Valid regular price is required";
    }
    if (!sku.trim()) newErrors.sku = "SKU is required";
    if (!shortDescription.trim()) newErrors.shortDescription = "Short description is required";
    if (!description.trim()) newErrors.description = "Description is required";

    if (mediaFiles.length === 0) {
      newErrors.media = "At least one media file is required";
    } else if (mediaFiles[0].type !== "image") {
      newErrors.media = "Primary media must be an image";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePrices = (reg, disc) => {
    if (reg && disc && parseFloat(disc) >= parseFloat(reg)) {
      setPriceError("Discount price must be less than regular price");
    } else {
      setPriceError("");
    }
  };

  const handleCancel = () => {
    navigate("/vendor/products");
  };

  return (
    <VendorLayout>
      <div className="add-product-container">
        {/* Back Button & Breadcrumbs */}
        <div className="add-product-top-nav">
          <div className="breadcrumbs">
            <span className="breadcrumb-item" onClick={handleCancel}>
              My Products
            </span>
            <ChevronRight size={14} color="#000" />
            <span className="breadcrumb-item active">Add New Product</span>
          </div>
        </div>

        {/* Header */}
        <div className="add-product-header">
          <div>
            <h1>{isEditMode ? "Edit Product" : "Add New Product"}</h1>
            <p>
              {isEditMode
                ? "Update your product details here."
                : "List a new item in your marketplace store."}
            </p>
          </div>
          {/* <div className="header-actions">
                        <button className="btn-secondary" onClick={handleCancel}>Cancel</button>
                        <button className="btn-primary">Save Product</button>
                    </div> */}
        </div>

        {/* Form Content */}

        {/* Section 1: Basic Information */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">1</div>
            <h2>Basic Information</h2>
          </div>

          <div className="form-group">
            <label>Product Name</label>
            <input
              type="text"
              className={`form-control ${errors.productName ? "error" : ""}`}
              placeholder="e.g. Minimalist Oak Coffee Table"
              value={productName}
              onChange={(e) => {
                setProductName(e.target.value);
                if (errors.productName) setErrors(prev => ({ ...prev, productName: "" }));
              }}
            />
            {errors.productName && <span className="error-message">{errors.productName}</span>}
          </div>

          <div className="form-group">
            <label>Product Type</label>
            <select
              className={`form-control ${productType === '' ? 'select-placeholder' : ''}`}
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
            >
              <option value="single">Single Product</option>
              <option value="grouped">Grouped Product</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group form-col" ref={categoryDropdownRef} style={{ position: "relative" }}>
              <label>Category</label>
              <input
                type="text"
                className={`form-control ${errors.category ? "error" : ""}`}
                placeholder="Search or select category..."
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setShowCategoryDropdown(true);
                  if (!e.target.value) {
                    setCategory("");
                    setSubCategory("");
                    setSubCategorySearch("");
                  }
                  if (errors.category) setErrors(prev => ({ ...prev, category: "" }));
                }}
                onFocus={() => setShowCategoryDropdown(true)}
              />
              {showCategoryDropdown && (
                <ul className="product-suggestions-dropdown">
                  {categories
                    .filter((c) => c.status === "Active" && c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                    .map((c) => (
                      <li
                        key={c.id}
                        className="product-suggestion-item"
                        onClick={() => {
                          setCategory(c.name);
                          setCategorySearch(c.name);
                          setShowCategoryDropdown(false);
                          setSubCategory("");
                          setSubCategorySearch("");
                          if (errors.category) setErrors(prev => ({ ...prev, category: "" }));
                        }}
                      >
                        {c.name}
                      </li>
                    ))}
                  {categories.filter((c) => c.status === "Active" && c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                    <li className="product-suggestion-item" style={{ color: "#888", cursor: "default" }}>
                      No categories found
                    </li>
                  )}
                </ul>
              )}
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>
            <div className="form-group form-col" ref={subCategoryDropdownRef} style={{ position: "relative" }}>
              <label>Sub Category</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search or select sub-category..."
                value={subCategorySearch}
                onChange={(e) => {
                  setSubCategorySearch(e.target.value);
                  setShowSubCategoryDropdown(true);
                  if (!e.target.value) {
                    setSubCategory("");
                  }
                }}
                onFocus={() => setShowSubCategoryDropdown(true)}
                disabled={!category}
              />
              {showSubCategoryDropdown && category && (
                <ul className="product-suggestions-dropdown">
                  {subCategories
                    .filter(
                      (sc) =>
                        sc.status === "Active" &&
                        sc.category?.name === category &&
                        sc.name.toLowerCase().includes(subCategorySearch.toLowerCase())
                    )
                    .map((sc) => (
                      <li
                        key={sc.id}
                        className="product-suggestion-item"
                        onClick={() => {
                          setSubCategory(sc.name);
                          setSubCategorySearch(sc.name);
                          setShowSubCategoryDropdown(false);
                        }}
                      >
                        {sc.name}
                      </li>
                    ))}
                  {subCategories.filter(
                    (sc) =>
                      sc.status === "Active" &&
                      sc.category?.name === category &&
                      sc.name.toLowerCase().includes(subCategorySearch.toLowerCase())
                  ).length === 0 && (
                    <li className="product-suggestion-item" style={{ color: "#888", cursor: "default" }}>
                      No sub-categories found
                    </li>
                  )}
                </ul>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Brand</label>
            <input
              type="text"
              className="form-control"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label>Short Description</label>
            <textarea
              className={`form-control ${errors.shortDescription ? "error" : ""}`}
              rows="2"
              placeholder="Provide a brief overview of the product for search results..."
              value={shortDescription}
              onChange={(e) => {
                setShortDescription(e.target.value);
                if (errors.shortDescription) setErrors(prev => ({ ...prev, shortDescription: "" }));
              }}
            ></textarea>
            {errors.shortDescription && <span className="error-message">{errors.shortDescription}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Description</label>
            <textarea
              className={`form-control ${errors.description ? "error" : ""}`}
              placeholder="Provide a detailed description of the product features and benefits..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors(prev => ({ ...prev, description: "" }));
              }}
            ></textarea>
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">2</div>
            <h2>Pricing & Inventory</h2>
          </div>

          <div className="pricing-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Regular Price (₹)</label>
              <input
                type="number"
                className="form-control"
                placeholder="0.00"
                value={regularPrice}
                onChange={handleRegularPriceChange}
              />
              {errors.regularPrice && <span className="error-message">{errors.regularPrice}</span>}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Discount Price (₹)</label>
              <input
                type="number"
                placeholder="0.00"
                value={discountPrice}
                onChange={handleDiscountPriceChange}
                className={`form-control ${priceError ? "error" : ""}`}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>SKU</label>
              <input
                type="text"
                className={`form-control ${errors.sku ? "error" : ""}`}
                placeholder="EHOME-001"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value);
                  if (errors.sku) setErrors(prev => ({ ...prev, sku: "" }));
                }}
              />
              {errors.sku && <span className="error-message">{errors.sku}</span>}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Initial Stock</label>
              <input
                type="number"
                min="0"
                className="form-control"
                placeholder="100"
                value={initialStock}
                onChange={handleInitialStockChange}
              />
            </div>
          </div>
          {priceError && (
            <div
              style={{
                color: "#E03E1A",
                fontSize: "0.85rem",
                marginTop: "0.75rem",
              }}
            >
              {priceError}
            </div>
          )}

          <div
            className="checkbox-group"
            style={{
              marginTop: "1.5rem",
              marginBottom: supportsWholesale ? "1rem" : 0,
            }}
          >
            <input
              type="checkbox"
              id="supportsWholesale"
              className="checkbox-custom"
              checked={supportsWholesale}
              onChange={(e) => setSupportsWholesale(e.target.checked)}
            />
            <label htmlFor="supportsWholesale">
              This product supports wholesale
            </label>
          </div>

          <div className="checkbox-group" style={{ marginBottom: "1rem" }}>
            <input
              type="checkbox"
              id="wholesaleOnly"
              className="checkbox-custom"
              checked={wholesaleOnly}
              onChange={(e) => setWholesaleOnly(e.target.checked)}
            />
            <label htmlFor="wholesaleOnly">
              Wholesale-only (hidden from regular customers)
            </label>
          </div>

          {supportsWholesale && (
            <div
              className="pricing-grid"
              style={{
                marginTop: "1rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #000",
              }}
            >
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Wholesale Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  placeholder="0.00"
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Minimum Order Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="10"
                  value={minimumWholesaleQuantity}
                  onChange={(e) => setMinimumWholesaleQuantity(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Discount Type</label>
                <select
                  className={`form-control ${!wholesaleDiscountType ? 'select-placeholder' : ''}`}
                  value={wholesaleDiscountType}
                  onChange={(e) => setWholesaleDiscountType(e.target.value)}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              {wholesaleDiscountType === "percentage" && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Discount Value (%)</label>
                  <select
                    className={`form-control ${!wholesalePrice ? 'select-placeholder' : ''}`}
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(e.target.value)}
                  >
                    <option value="">Select Percentage</option>
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                    <option value="15">15%</option>
                    <option value="20">20%</option>
                    <option value="25">25%</option>
                    <option value="30">30%</option>
                    <option value="40">40%</option>
                    <option value="50">50%</option>
                    <option value="60">60%</option>
                    <option value="70">70%</option>
                    <option value="75">75%</option>
                    <option value="80">80%</option>
                    <option value="90">90%</option>
                    <option value="100">100%</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* ─── Bulk / Tiered Pricing Section ─── */}
          <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 600 }}>Bulk / Tiered Pricing</h3>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#666" }}>
                  Set different prices for different quantity ranges. Customers who buy more pay less.
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ display: "flex", alignItems: "center", gap: "0.4rem", borderStyle: "dashed", fontSize: "0.85rem" }}
                onClick={handleAddPricingTier}
              >
                <Plus size={16} /> Add Tier
              </button>
            </div>

            {pricingTiers.length === 0 && (
              <div style={{ padding: "1.5rem", background: "#f9f9f9", borderRadius: "8px", border: "1px dashed #ccc", textAlign: "center", color: "#888", fontSize: "0.9rem" }}>
                No pricing tiers configured. Click "Add Tier" to create quantity-based pricing rules.
              </div>
            )}

            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                style={{
                  display: "flex", gap: "0.75rem", alignItems: "flex-start",
                  padding: "1rem", marginBottom: "0.75rem",
                  background: "#fff", borderRadius: "8px", border: "1px solid #e0e0e0",
                  flexWrap: "wrap",
                }}
              >
                <div className="form-group" style={{ marginBottom: 0, flex: "1 1 120px", minWidth: "100px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 500 }}>Min Qty</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    placeholder="e.g. 5"
                    value={tier.minQuantity}
                    onChange={(e) => handlePricingTierChange(index, "minQuantity", e.target.value)}
                    style={{ height: "38px", fontSize: "0.85rem" }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: "1 1 120px", minWidth: "100px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 500 }}>Max Qty</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    placeholder="Leave empty for 10+"
                    value={tier.maxQuantity}
                    onChange={(e) => handlePricingTierChange(index, "maxQuantity", e.target.value)}
                    style={{ height: "38px", fontSize: "0.85rem" }}
                  />
                  <small style={{ fontSize: "0.7rem", color: "#999" }}>Leave empty for "and above"</small>
                </div>
                <div className="form-group" style={{ marginBottom: 0, flex: "1 1 120px", minWidth: "120px" }}>
                  <label style={{ fontSize: "0.8rem", fontWeight: 500 }}>Pricing Type</label>
                  <select
                    className="form-control"
                    value={tier.discountType}
                    onChange={(e) => handlePricingTierChange(index, "discountType", e.target.value)}
                    style={{ height: "38px", fontSize: "0.85rem" }}
                  >
                    <option value="percentage">% Discount</option>
                    <option value="fixed">Fixed Discount (₹)</option>
                    <option value="unitPrice">Fixed Unit Price</option>
                  </select>
                </div>
                {tier.discountType === "unitPrice" ? (
                  <div className="form-group" style={{ marginBottom: 0, flex: "1 1 120px", minWidth: "100px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 500 }}>Unit Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      placeholder="0.00"
                      value={tier.unitPrice}
                      onChange={(e) => handlePricingTierChange(index, "unitPrice", e.target.value)}
                      style={{ height: "38px", fontSize: "0.85rem" }}
                    />
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: 0, flex: "1 1 120px", minWidth: "100px" }}>
                    <label style={{ fontSize: "0.8rem", fontWeight: 500 }}>{tier.discountType === "percentage" ? "Discount %" : "Discount (₹)"}</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      placeholder={tier.discountType === "percentage" ? "e.g. 10" : "e.g. 500"}
                      value={tier.discountValue}
                      onChange={(e) => handlePricingTierChange(index, "discountValue", e.target.value)}
                      style={{ height: "38px", fontSize: "0.85rem" }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemovePricingTier(index)}
                  style={{
                    marginTop: "1.5rem",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#FF5722", fontSize: "1.2rem", padding: "0.25rem",
                    flexShrink: 0,
                  }}
                  title="Remove tier"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Product Media */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">3</div>
            <h2>Product Media</h2>
          </div>

          <div
            className="upload-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
          >
            <div className="upload-icon-wrapper">
              <ImageIcon size={24} />
            </div>
            <h3>Drag and drop product images or videos here</h3>
            <p>PNG, JPG, WEBP, or MP4 up to 10MB each. Suggested ratio 1:1.</p>
            <button
              className="btn-file"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current.click();
              }}
            >
              Browse files
            </button>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              style={{ display: "none" }}
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {errors.media && <span className="error-message" style={{ marginTop: '1rem', display: 'block' }}>{errors.media}</span>}
          </div>

            <div className="image-preview-row" style={{ flexWrap: "wrap" }}>
              {mediaFiles.map((media, index) => (
              <div
                className={`image-thumbnail-wrapper ${index === 0 ? "primary" : ""}`}
                key={media.url} // using url for stability during reorder
                draggable
                onDragStart={(e) => handleThumbnailDragStart(e, index)}
                onDragEnter={(e) => handleThumbnailDragEnter(e, index)}
                onDragEnd={handleThumbnailDragEnd}
                onDragOver={handleThumbnailDragOver}
                style={{
                  cursor: "grab",
                  opacity: draggedItemIndex === index ? 0.5 : 1,
                }}
              >
{media.type === "video" ? (
                    <video src={media.url} className="image-thumbnail" muted/>
                  ) : (
                    <img
                      src={media.url}
                      alt={`Preview ${index}`}
                      className="image-thumbnail"
                      draggable="false"
                    />
                  )}

                {index === 0 ? (
                  <div className="primary-label">Primary</div>
                ) : (
                  <button
                    type="button"
                    className="set-primary-btn"
                    onClick={() => setPrimary(index)}
                  >
                    Set Primary
                  </button>
                )}
                <button
                  className="remove-media-btn"
                  onClick={(e) => removeMedia(index, e)}
                  title="Remove"
                  type="button"
                  style={{ cursor: "pointer" }}
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              className="add-thumbnail-btn"
              type="button"
              onClick={() => fileInputRef.current.click()}
            >
              <Plus size={24} />
            </button>
          </div>
        </div>

        {/* Section 4: Attributes */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">4</div>
            <h2>Attributes & Tags</h2>
          </div>

          <div className="attributes-grid" style={{ display: "block" }}>
            {attributes.map((attr, index) => (
              <div
                key={index}
                className="form-row"
                style={{ marginBottom: "1rem", alignItems: "flex-start" }}
              >
                <div
                  className="form-group form-col"
                  style={{ marginBottom: 0 }}
                >
                  {index === 0 && <label>Attribute</label>}
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Material"
                    value={attr.name}
                    onChange={(e) =>
                      handleAttributeChange(index, "name", e.target.value)
                    }
                  />
                </div>
                <div
                  className="form-group form-col"
                  style={{ marginBottom: 0 }}
                >
                  {index === 0 && <label>Attribute Value</label>}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Solid Oak"
                      value={attr.value}
                      onChange={(e) =>
                        handleAttributeChange(index, "value", e.target.value)
                      }
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        padding: "0.75rem",
                        borderColor: "#ffdddd",
                        color: "#FF5722",
                        backgroundColor: "#FFF0EB",
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onClick={() => handleRemoveAttribute(index)}
                      disabled={attributes.length === 1}
                    >
                      &times;
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "1rem",
                borderStyle: "dashed",
              }}
              onClick={handleAddAttribute}
            >
              <Plus size={16} /> Add Attribute
            </button>

            <div
              className="form-row"
              style={{ marginTop: "1.5rem", alignItems: "flex-start" }}
            >
              <div
                className="form-group form-col"
                style={{ flex: 2, marginBottom: 0 }}
              >
                <label>Tags</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Press enter or comma to add a tag (e.g. Handmade, Wooden)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
                {tags.length > 0 && (
                  <div className="product-tags-container">
                    {tags.map((tag, index) => (
                      <span key={index} className="product-tag">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="product-tag-remove"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div
                className="form-group form-col"
                style={{ flex: 1, marginBottom: 0 }}
              >
                <label>Country of Origin</label>
                <select className="form-control" defaultValue="in">
                  <option value="in">India</option>
                </select>
              </div>
            </div>
          </div>

          <div className="checkbox-group">
            <input
              type="checkbox"
              id="fragileHandling"
              className="checkbox-custom"
            />
            <label htmlFor="fragileHandling">
              This product requires special fragile shipping handling
            </label>
          </div>
        </div>

        {/* Section 5: Product Variations */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">5</div>
            <h2>Product Variations</h2>
          </div>
          <p
            style={{
              color: "#000",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
              marginTop: "-1rem",
            }}
          >
            Add variations of this product (e.g. different colors, sizes) if
            applicable. Leave empty for a simple product.
          </p>

          <div className="variations-grid" style={{ display: "block" }}>
            {variations.map((variation, index) => (
              <div
                key={index}
                className="form-row"
                style={{
                  marginBottom: "1.5rem",
                  padding: "1rem",
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "1px solid #000",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    width: "100%",
                  }}
                >
                  {/* Action row / Checkbox */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div className="checkbox-group" style={{ margin: 0 }}>
                      <input
                        type="checkbox"
                        id={`useMainPricing-${index}`}
                        className="checkbox-custom"
                        checked={variation.useMainPricing !== false} // default to true if undefined
                        onChange={(e) =>
                          handleVariationChange(
                            index,
                            "useMainPricing",
                            e.target.checked,
                          )
                        }
                      />
                      <label htmlFor={`useMainPricing-${index}`}>
                        Use main product pricing
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{
                        padding: "0.5rem 0.75rem",
                        color: "#FF5722",
                        backgroundColor: "#FFF0EB",
                        fontSize: "0.85rem",
                      }}
                      onClick={() => handleRemoveVariation(index)}
                    >
                      &times; Remove
                    </button>
                  </div>

                  <div className="form-row">
                    <div
                      className="form-group form-col"
                      style={{ marginBottom: 0 }}
                    >
                      <label>Variation Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Size M, Red"
                        value={variation.name}
                        onChange={(e) =>
                          handleVariationChange(index, "name", e.target.value)
                        }
                      />
                    </div>
                    <div
                      className="form-group form-col"
                      style={{ marginBottom: 0 }}
                    >
                      <label>SKU</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. PROD-M-RED"
                        value={variation.sku}
                        onChange={(e) =>
                          handleVariationChange(index, "sku", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div
                      className="form-group form-col"
                      style={{ marginBottom: 0 }}
                    >
                      <label>Price (₹)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder={
                          variation.useMainPricing !== false
                            ? "Using Main Price"
                            : "0.00"
                        }
                        value={
                          variation.useMainPricing !== false
                            ? regularPrice
                            : variation.price
                        }
                        onChange={(e) => {
                          if (variation.useMainPricing === false) {
                            handleVariationChange(
                              index,
                              "price",
                              e.target.value,
                            );
                          }
                        }}
                        disabled={variation.useMainPricing !== false}
                      />
                    </div>
                    <div
                      className="form-group form-col"
                      style={{ marginBottom: 0 }}
                    >
                      <label>Stock</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="0"
                        min="0"
                        value={variation.stock}
                        onChange={(e) =>
                          handleVariationChange(index, "stock", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Variation Images Section */}
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <label style={{ margin: 0, fontWeight: "600", fontSize: "0.9rem" }}>Variation Images</label>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", display: "flex", gap: "0.4rem", alignItems: "center", border: "1px solid #ccc", background: "#fff", color: "#333" }}
                        onClick={(e) => e.currentTarget.nextElementSibling.click()}
                      >
                        <Plus size={14} /> Add Image
                      </button>
                      <input
                        type="file"
                        multiple
                        accept="image/*,video/*"
                        style={{ display: "none" }}
                        onChange={(e) => handleVariationFileChange(index, e)}
                      />
                    </div>
                    <div className="image-preview-row" style={{ flexWrap: "wrap", gap: "0.75rem", marginTop: "0.8rem" }}>
                      {(variation.images || []).map((media, imgIndex) => (
                        <div className={`image-thumbnail-wrapper ${imgIndex === 0 ? "primary" : ""}`} key={media.url || imgIndex} style={{ width: "80px", height: "80px", marginBottom: 0, position: "relative", border: "1px solid #ddd", borderRadius: "8px", padding: 0 }}>
{media.type === "video" ? (
                              <video src={media.url} className="image-thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} muted/>
                            ) : (
                              <img src={media.url} alt={`Var Preview ${imgIndex}`} className="image-thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}/>
                            )}
                          {imgIndex === 0 ? (
                            <div className="primary-label" style={{ position: "absolute", bottom: 0, left: 0, width: "100%", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "0.6rem", textAlign: "center", padding: "0.1rem 0", borderBottomLeftRadius: "8px", borderBottomRightRadius: "8px" }}>Primary</div>
                          ) : (
                            <button
                              type="button"
                              className="set-primary-btn"
                              style={{ position: "absolute", bottom: 0, left: 0, width: "100%", fontSize: "0.55rem", background: "rgba(255,255,255,0.9)", border: "none", borderTop: "1px solid #ccc", padding: "0.1rem 0", borderBottomLeftRadius: "8px", borderBottomRightRadius: "8px", cursor: "pointer" }}
                              onClick={() => setVariationPrimary(index, imgIndex)}
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            className="remove-media-btn"
                            onClick={(e) => removeVariationMedia(index, imgIndex, e)}
                            title="Remove"
                            type="button"
                            style={{ cursor: "pointer", width: "18px", height: "18px", fontSize: "14px", right: "-6px", top: "-6px", position: "absolute", zIndex: 10, background: "#fff", color: "#ff5722", border: "1px solid #ffdddd", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Variation Details Section */}
                  <div className="checkbox-group" style={{ marginTop: "1rem", marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      id={`useMainAttrs-${index}`}
                      className="checkbox-custom"
                      checked={variation.useMainAttributesAndTags !== false}
                      onChange={(e) =>
                        handleVariationChange(
                          index,
                          "useMainAttributesAndTags",
                          e.target.checked
                        )
                      }
                    />
                    <label htmlFor={`useMainAttrs-${index}`}>
                      Use main product attributes and tags
                    </label>
                  </div>

                  {variation.useMainAttributesAndTags === false && (
                    <div style={{ marginTop: "1rem", padding: "1.2rem", backgroundColor: "#fdfdfd", borderRadius: "8px", border: "1px dashed #ccc" }}>
                      <div style={{ marginBottom: "1.5rem" }}>
                        <label style={{ display: "block", marginBottom: "0.8rem", fontWeight: "600", fontSize: "0.9rem" }}>Variation Attributes</label>
                        {(variation.attributes || []).map((attr, attrIndex) => (
                          <div key={attrIndex} className="form-row" style={{ marginBottom: "0.75rem", alignItems: "flex-start" }}>
                            <div className="form-group form-col" style={{ marginBottom: 0 }}>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Name (e.g. Size)"
                                value={attr.name}
                                onChange={(e) => handleVariationAttributeChange(index, attrIndex, "name", e.target.value)}
                                style={{ fontSize: "0.9rem" }}
                              />
                            </div>
                            <div className="form-group form-col" style={{ marginBottom: 0 }}>
                              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Value (e.g. XL)"
                                  value={attr.value}
                                  onChange={(e) => handleVariationAttributeChange(index, attrIndex, "value", e.target.value)}
                                  style={{ fontSize: "0.9rem" }}
                                />
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  style={{ padding: "0.4rem 0.6rem", color: "#FF5722", backgroundColor: "#FFF0EB", height: "auto", border: "1px solid #ffdddd" }}
                                  onClick={() => handleRemoveVariationAttribute(index, attrIndex)}
                                >
                                  &times;
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ fontSize: "0.85rem", padding: "0.5rem 0.8rem", borderStyle: "dashed", display: "flex", alignItems: "center", gap: "0.3rem", background: "#fff", color: "#333", border: "1px dashed #ccc" }}
                          onClick={() => handleAddVariationAttribute(index)}
                        >
                          <Plus size={14} /> Add Attribute
                        </button>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontWeight: "600", fontSize: "0.9rem", marginBottom: "0.5rem" }}>Variation Tags</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Press enter to add tag"
                          value={variation.tagInput || ""}
                          onChange={(e) => handleVariationChange(index, "tagInput", e.target.value)}
                          onKeyDown={(e) => handleAddVariationTag(index, e)}
                          style={{ fontSize: "0.9rem" }}
                        />
                        {(variation.tags || []).length > 0 && (
                          <div className="product-tags-container" style={{ marginTop: "0.8rem" }}>
                            {(variation.tags || []).map((tag, tagIndex) => (
                              <span key={tagIndex} className="product-tag">
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveVariationTag(index, tag)}
                                  className="product-tag-remove"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="btn-secondary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.5rem",
              borderStyle: "dashed",
            }}
            onClick={handleAddVariation}
          >
            <Plus size={16} /> Add Variation
          </button>
        </div>

        {/* Section 6: Linked Products */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">6</div>
            <h2>Linked Products</h2>
          </div>
          <p
            style={{
              color: "#000",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
              marginTop: "-1rem",
            }}
          >
            Recommend alternatives or additional items to your customers.
          </p>

          <div className="form-row">
            <div className="form-group form-col">
              <label>Up-sells</label>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#000",
                  marginTop: "-0.25rem",
                  marginBottom: "0.5rem",
                  minHeight: "3.5rem",
                }}
              >
                Products which you recommend instead of the currently viewed
                product, for example, products that are more profitable or
                better quality.
              </p>
              <div style={{ position: "relative" }} ref={upsellDropdownRef}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by product name or SKU..."
                  value={upsellInput}
                  onChange={handleUpsellInputChange}
                  onKeyDown={handleAddUpsell}
                />
                {showUpsellDropdown && upsellSuggestions.length > 0 && (
                  <ul className="product-suggestions-dropdown">
{upsellSuggestions.map((product) => (
                       <li
                         key={product.id}
                         onClick={() => handleSelectUpsell(product)}
                         className="product-suggestion-item"
                       >
                         {product.imageUrls?.[0] ? (
                           <img
                             key={`upsell-img-${product.id || Math.random()}`}
                             src={product.imageUrls[0].startsWith("http") ? product.imageUrls[0] : `${BACKEND_URL}${product.imageUrls[0]}`}
                             alt=""
                             className="product-suggestion-img"
                            />
                          ) : (
                            <img
                              key={`upsell-img-${product.id || Math.random()}-placeholder`}
                            src={PLACEHOLDER_IMG}
                              alt=""
                              className="product-suggestion-img"
                            />
                           )}
                         <div className="product-suggestion-info">
                           <span className="product-suggestion-name">{product.name || product.productName}</span>
                           <div className="product-suggestion-meta">
                             {product.sku && (
                               <span className="product-suggestion-sku">SKU: {product.sku}</span>
                             )}
                             {product.regularPrice && (
                               <span className="product-suggestion-price">&#8377;{product.regularPrice}</span>
                             )}
                           </div>
                         </div>
                       </li>
                     ))}
                   </ul>
                 )}
               </div>
               {upsells.length > 0 && (
                <div className="product-tags-container">
                  {upsells.map((item, index) => (
                    <span key={index} className="product-tag">
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveUpsell(item)}
                        className="product-tag-remove"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group form-col">
              <label>Cross-sells</label>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#000",
                  marginTop: "-0.25rem",
                  marginBottom: "0.5rem",
                  minHeight: "3.5rem",
                }}
              >
                Products which you promote in the cart, based on the current
                product.
              </p>
              <div style={{ position: "relative" }} ref={crossSellDropdownRef}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by product name or SKU..."
                  value={crossSellInput}
                  onChange={handleCrossSellInputChange}
                  onKeyDown={handleAddCrossSell}
                />
                {showCrossSellDropdown && crossSellSuggestions.length > 0 && (
                  <ul className="product-suggestions-dropdown">
{crossSellSuggestions.map((product) => (
                       <li
                         key={product.id}
                         onClick={() => handleSelectCrossSell(product)}
                         className="product-suggestion-item"
                       >
                         {product.imageUrls?.[0] ? (
                           <img
                             key={`crosssell-img-${product.id || Math.random()}`}
                             src={product.imageUrls[0].startsWith("http") ? product.imageUrls[0] : `${BACKEND_URL}${product.imageUrls[0]}`}
                             alt=""
                             className="product-suggestion-img"
                            />
                          ) : (
                            <img
                              key={`crosssell-img-${product.id || Math.random()}-placeholder`}
                            src={PLACEHOLDER_IMG}
                              alt=""
                              className="product-suggestion-img"
                            />
                           )}
                         <div className="product-suggestion-info">
                           <span className="product-suggestion-name">{product.name || product.productName}</span>
                           <div className="product-suggestion-meta">
                             {product.sku && (
                               <span className="product-suggestion-sku">SKU: {product.sku}</span>
                             )}
                             {product.regularPrice && (
                               <span className="product-suggestion-price">&#8377;{product.regularPrice}</span>
                             )}
                           </div>
                         </div>
                       </li>
                     ))}
                   </ul>
                 )}
               </div>
               {crossSells.length > 0 && (
                <div className="product-tags-container">
                  {crossSells.map((item, index) => (
                    <span key={index} className="product-tag">
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveCrossSell(item)}
                        className="product-tag-remove"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group form-col">
              <label>Frequently Bought Together</label>
              <p style={{ fontSize: "0.8rem", color: "#000", marginTop: "-0.25rem", marginBottom: "0.5rem", minHeight: "3.5rem" }}>
                Products frequently purchased together with this item. Displayed as a bundle on the product page.
              </p>
              <div style={{ position: "relative" }} ref={boughtTogetherDropdownRef}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by product name or SKU..."
                  value={boughtTogetherInput}
                  onChange={handleBoughtTogetherInputChange}
                  onKeyDown={handleAddBoughtTogether}
                />
                {showBoughtTogetherDropdown && boughtTogetherSuggestions.length > 0 && (
                  <ul className="product-suggestions-dropdown">
{boughtTogetherSuggestions.map((product) => (
                       <li
                         key={product.id}
                         onClick={() => handleSelectBoughtTogether(product)}
                         className="product-suggestion-item"
                       >
                         {product.imageUrls?.[0] ? (
                           <img
                             key={`boughttogether-img-${product.id || Math.random()}`}
                             src={product.imageUrls[0].startsWith("http") ? product.imageUrls[0] : `${BACKEND_URL}${product.imageUrls[0]}`}
                             alt=""
                             className="product-suggestion-img"
                            />
                          ) : (
                            <img
                              key={`boughttogether-img-${product.id || Math.random()}-placeholder`}
                            src={PLACEHOLDER_IMG}
                              alt=""
                              className="product-suggestion-img"
                            />
                           )}
                         <div className="product-suggestion-info">
                           <span className="product-suggestion-name">{product.name || product.productName}</span>
                           <div className="product-suggestion-meta">
                             {product.sku && <span className="product-suggestion-sku">SKU: {product.sku}</span>}
                             {product.regularPrice && <span className="product-suggestion-price">&#8377;{product.regularPrice}</span>}
                           </div>
                         </div>
                       </li>
                     ))}
                   </ul>
                 )}
               </div>
               {boughtTogether.length > 0 && (
                <div className="product-tags-container">
                  {boughtTogether.map((item, index) => (
                    <span key={index} className="product-tag">
                      {item}
                      <button type="button" onClick={() => handleRemoveBoughtTogether(item)} className="product-tag-remove">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section 6.5: From the Manufacturer Settings */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">7</div>
            <h2>From the Manufacturer</h2>
          </div>

          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label">Layout Design</label>
              <p className="form-help-text" style={{ fontSize: '0.82rem', color: '#8A7F75', marginBottom: '0.75rem' }}>
                Choose how the "From the Manufacturer" section appears on the product page.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { value: 'collage', label: 'Collage', desc: 'Mixed grid layout' },
                  { value: 'grid', label: 'Grid', desc: 'Even grid of images' },
                  { value: 'slider', label: 'Slider', desc: 'Full-width carousel' },
                  { value: 'masonry', label: 'Masonry', desc: 'Pinterest-style' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setManufacturerLayout(opt.value)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '10px',
                      border: manufacturerLayout === opt.value ? '2px solid #FF5722' : '1px solid #E8DDD4',
                      background: manufacturerLayout === opt.value ? '#FFF3E0' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      minWidth: '140px',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2C2C2C', marginBottom: '4px' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8A7F75' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '1.5rem' }}>
            <div className="form-group form-col">
              <label className="form-label">Manufacturer Images</label>
              <p className="form-help-text" style={{ fontSize: '0.82rem', color: '#8A7F75', marginBottom: '0.75rem' }}>
                Upload images for the "From the Manufacturer" section. These will only appear in the "From the Manufacturer" section on the product page, not in the product gallery.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
{manufacturerMedia.map((m, i) => (
                  <div key={m.id || i} style={{
                    width: '100px', height: '100px', borderRadius: '10px', overflow: 'hidden',
                    border: '1px solid #E8DDD4', position: 'relative', background: '#F9F5F0', flexShrink: 0
                  }}>
                    <img src={m.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                  </div>
                ))}
                <div
                  onClick={() => mfrFileInputRef.current?.click()}
                  style={{
                    width: '100px', height: '100px', borderRadius: '10px', border: '2px dashed #E8DDD4',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', background: '#FFFBF8', gap: '4px', flexShrink: 0
                  }}
                >
                  <ImageIcon size={20} color="#C9A87C" />
                  <span style={{ fontSize: '0.7rem', color: '#8A7F75' }}>Add Images</span>
                </div>
              </div>
              <input ref={mfrFileInputRef} type="file" multiple accept="image/*" onChange={handleMfrFileChange} style={{ display: 'none' }} />
              <div style={{
                background: '#FFFBF8', border: '1px solid #E8DDD4', borderRadius: '10px',
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                fontSize: '0.82rem', color: '#6B635B'
              }}>
                <ImageIcon size={18} color="#C9A87C" />
                <span>Currently <strong>{manufacturerMedia.length || 0}</strong> manufacturer image(s).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Video Gallery */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">8</div>
            <h2>Video Gallery</h2>
          </div>
          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label">Product Video URLs</label>
              <p className="form-help-text" style={{ fontSize: '0.82rem', color: '#8A7F75', marginBottom: '0.75rem' }}>
                Add YouTube or direct video URLs. These will appear in a video gallery section on the product page.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddVideoUrl(); } }}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-primary" onClick={handleAddVideoUrl} style={{ whiteSpace: 'nowrap' }}>
                  Add
                </button>
              </div>
              {videoUrls.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  {videoUrls.map((url, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px', borderRadius: '8px', border: '1px solid #E8DDD4',
                      background: '#FFFBF8', fontSize: '0.82rem'
                    }}>
                      <Video size={16} color="#C9A87C" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#2C2C2C' }}>{url}</span>
                      <button type="button" onClick={() => handleRemoveVideoUrl(i)} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1.1rem', padding: '0 4px'
                      }}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{
                background: '#FFFBF8', border: '1px solid #E8DDD4', borderRadius: '10px',
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                fontSize: '0.82rem', color: '#6B635B'
              }}>
                <ImageIcon size={18} color="#C9A87C" />
                <span>Currently <strong>{videoUrls.length || 0}</strong> video URL(s).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 8: Shipping, Tax & Policies */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">9</div>
            <h2>Shipping, Tax & Policies</h2>
          </div>

          <div className="form-row">
            <div className="form-group form-col" style={{ flex: 1 }}>
              <label>Weight (kg)</label>
              <input
                type="number"
                className="form-control"
                placeholder="0.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div className="form-group form-col" style={{ flex: 2 }}>
              <label>Dimensions (cm)</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Length"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Width"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="Height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div
            className="form-group"
            style={{ marginBottom: 0, marginTop: "0.5rem" }}
          >
            <label>Policy Documents</label>
            <p
              style={{
                fontSize: "0.8rem",
                color: "#000",
                marginTop: "-0.25rem",
                marginBottom: "0.5rem",
              }}
            >
              Upload warranty, manuals, or specific policy documents (e.g. PDF,
              DOCX).
            </p>

            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              ref={policyFileInputRef}
              style={{ display: "none" }}
              onChange={handlePolicyDocumentChange}
            />

            <button
              type="button"
              className="btn-secondary"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.5rem",
                borderStyle: "dashed",
              }}
              onClick={() => policyFileInputRef.current.click()}
            >
              <Plus size={16} /> Upload Document
            </button>

            {policyDocuments.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                  marginTop: "1rem",
                }}
              >
                {policyDocuments.map((doc, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem 1rem",
                      backgroundColor: "#fff",
                      border: "1px solid #000",
                      borderRadius: "6px",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        overflow: "hidden",
                        flex: 1,
                      }}
                    >
                      <FileText
                        size={18}
                        color="#FF5722"
                        style={{ flexShrink: 0 }}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                          gap: "0.25rem",
                        }}
                      >
                        <input
                          type="text"
                          value={doc.title}
                          onChange={(e) =>
                            handlePolicyTitleChange(index, e.target.value)
                          }
                          placeholder="Document Title (e.g., Warranty Information)"
                          className="form-control"
                          style={{
                            height: "32px",
                            fontSize: "0.85rem",
                            maxWidth: "300px",
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#000",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          File: {doc.name}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePolicyDocument(index)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#FF5722",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0.25rem",
                      }}
                      title="Remove Document"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instagram Feed Section */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">10</div>
            <h2>Instagram Feed</h2>
          </div>
          <div className="form-row">
            <div className="form-group form-col">
              <label className="form-label">Instagram Post URLs</label>
              <p className="form-help-text" style={{ fontSize: '0.82rem', color: '#8A7F75', marginBottom: '0.75rem' }}>
                Add Instagram post URLs (e.g., https://www.instagram.com/p/ABC123/). These will appear in an Instagram-style feed on the product page.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://www.instagram.com/p/..."
                  value={instagramUrlInput}
                  onChange={(e) => setInstagramUrlInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInstagramUrl(); } }}
                  style={{ flex: 1 }}
                />
                <button onClick={handleAddInstagramUrl} className="btn-primary" style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>
                  <Plus size={16} /> Add
                </button>
              </div>
              {instagramUrls.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {instagramUrls.map((url, i) => (
                    <div key={i} style={{
                      background: '#FFFBF8', border: '1px solid #E8DDD4', borderRadius: '10px',
                      padding: '10px 14px', fontSize: '0.82rem', maxWidth: '100%'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: instagramProductLinks[i] ? '6px' : 0 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px', color: '#2C2C2C', flex: 1 }}>
                          {url}
                        </span>
                        <button onClick={() => handleRemoveInstagramUrl(i)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', color: '#D4857F',
                          fontSize: '1.1rem', padding: '0 2px', lineHeight: 1, flexShrink: 0
                        }}>&times;</button>
                      </div>
                      <div style={{ position: 'relative' }} ref={(el) => instagramProductInputRefs.current[i] = el}>
                        {instagramProductLinks[i] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}>
                            <span style={{ fontSize: '0.8rem', color: '#2C2C2C', background: '#FFF3E0', padding: '3px 10px', borderRadius: '6px', border: '1px solid #FFE0B2' }}>
                              {instagramProductLinks[i]}
                              <button type="button" onClick={() => handleRemoveInstagramProductLink(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4857F', fontSize: '1rem', marginLeft: '6px', padding: 0, lineHeight: 1 }}>&times;</button>
                            </span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Search & link a product (optional)"
                            value={activeInstagramProductIndex === i ? instagramProductInput : ''}
                            onChange={(e) => handleInstagramProductInputChange(i, e.target.value)}
                            onFocus={() => setActiveInstagramProductIndex(i)}
                            style={{
                              width: '100%', border: '1px solid #E8DDD4', borderRadius: '6px',
                              padding: '6px 10px', fontSize: '0.8rem', marginTop: '6px',
                              background: '#fff', color: '#2C2C2C', outline: 'none',
                              boxSizing: 'border-box'
                            }}
                          />
                        )}
                        {showInstagramProductDropdown && activeInstagramProductIndex === i && instagramProductSuggestions.length > 0 && (
                          <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: '#fff', border: '1px solid #E8DDD4', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', margin: '2px 0 0', padding: '6px 0', listStyle: 'none', maxHeight: '200px', overflowY: 'auto' }}>
                            {instagramProductSuggestions.map((product) => (
                              <li
                                key={product.id}
                                onClick={() => handleSelectInstagramProduct(i, product)}
                                style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', borderBottom: '1px solid #f5f0eb' }}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                <img
                                  src={product.imageUrls?.[0] ? (product.imageUrls[0].startsWith('http') ? product.imageUrls[0] : `${BACKEND_URL}${product.imageUrls[0]}`) : PLACEHOLDER_IMG}
                                  alt="" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                                />
                                <div>
                                  <div style={{ fontWeight: 500, color: '#2C2C2C' }}>{product.name || product.productName}</div>
                                  {product.regularPrice && <div style={{ fontSize: '0.75rem', color: '#888' }}>&#8377;{product.regularPrice}</div>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        {instagramThumbnails[i]?.preview ? (
                          <div style={{ position: 'relative', width: '44px', height: '44px', flexShrink: 0 }}>
                            <img src={instagramThumbnails[i].preview} alt="thumb" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #E8DDD4' }} />
                            <button type="button" onClick={() => removeInstagramThumbnail(i)} style={{ position: 'absolute', top: '-5px', right: '-5px', width: '16px', height: '16px', borderRadius: '50%', background: '#D4857F', color: '#fff', border: 'none', fontSize: '10px', lineHeight: '16px', textAlign: 'center', cursor: 'pointer', padding: 0 }}>&times;</button>
                          </div>
                        ) : (
                          <label style={{ width: '44px', height: '44px', borderRadius: '8px', border: '1px dashed #E8DDD4', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, color: '#C9A87C', fontSize: '1.2rem' }}>
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleInstagramThumbnail(i, e.target.files[0]); }} />
                            +
                          </label>
                        )}
                        <span style={{ fontSize: '0.75rem', color: '#8A7F75' }}>Custom thumbnail</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{
                background: '#FFFBF8', border: '1px solid #E8DDD4', borderRadius: '10px',
                padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                fontSize: '0.82rem', color: '#6B635B', marginBottom: '1.5rem'
              }}>
                <ImageIcon size={18} color="#C9A87C" />
                <span>Currently <strong>{instagramUrls.length || 0}</strong> Instagram URL(s).</span>
              </div>

              <label className="form-label">Feed Layout</label>
              <p className="form-help-text" style={{ fontSize: '0.82rem', color: '#8A7F75', marginBottom: '0.75rem' }}>
                Choose how the Instagram feed appears on the product page.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {[
                  { value: 'grid', label: 'Grid', desc: 'Multi-column grid layout' },
                  { value: 'slider', label: 'Slider', desc: 'Horizontal carousel with arrows' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setInstagramFeedLayout(opt.value)}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '10px',
                      border: instagramFeedLayout === opt.value ? '2px solid #FF5722' : '1px solid #E8DDD4',
                      background: instagramFeedLayout === opt.value ? '#FFF3E0' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      minWidth: '140px',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2C2C2C', marginBottom: '4px' }}>{opt.label}</div>
                    <div style={{ fontSize: '0.75rem', color: '#8A7F75' }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SEO Section */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">11</div>
            <h2>Search Engine Optimization</h2>
          </div>

          <div className="form-group">
            <label>Meta Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter meta title for search engines (e.g., Buy Silk Saree Online | SreeMarket)"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              maxLength={70}
            />
            <span className="field-hint" style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
              {metaTitle.length}/70 characters. This appears as the clickable title in search results.
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Meta Description</label>
            <textarea
              className="form-control"
              placeholder="Enter meta description for search engines (e.g., Shop premium handwoven silk sarees at SreeMarket. Free shipping across India.)"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              maxLength={160}
              rows={3}
            ></textarea>
            <span className="field-hint" style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
              {metaDescription.length}/160 characters. This appears as the description snippet in search results.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            marginTop: "1rem",
          }}
        >
          {submitError && (
            <div
              style={{
                color: "#FF5722",
                fontSize: "0.9rem",
                marginBottom: "1rem",
                fontWeight: 500,
              }}
            >
              {submitError}
            </div>
          )}
          <div className="form-footer-actions" style={{ marginTop: 0 }}>
            <button className="btn-secondary" onClick={handleCancel}>
              Discard
            </button>
            <button className="btn-primary" onClick={handleSaveProduct}>
              {isEditMode ? "Update Product" : "Save Product"}
            </button>
          </div>
        </div>
      </div>
    </VendorLayout>
  );
};

export default AddProduct;
