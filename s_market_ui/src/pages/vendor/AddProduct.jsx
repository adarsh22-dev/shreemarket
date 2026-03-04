import React, { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Plus,
  ArrowLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import VendorLayout from "../../components/vendor/VendorLayout";
import "./AddProduct.css";
import { useNavigate, useParams } from "react-router-dom";
import {
  addProduct,
  getProduct,
  updateProduct,
  BACKEND_URL,
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
  const [brand, setBrand] = useState("EmpowerHome Basics");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");

  const [regularPrice, setRegularPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [priceError, setPriceError] = useState("");
  const [initialStock, setInitialStock] = useState("");
  const [supportsWholesale, setSupportsWholesale] = useState(false);
  const [wholesaleDiscountType, setWholesaleDiscountType] =
    useState("percentage");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [submitError, setSubmitError] = useState("");
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [attributes, setAttributes] = useState([{ name: "", value: "" }]);
  const [variations, setVariations] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  // Linked Products State
  const [upsells, setUpsells] = useState([]);
  const [upsellInput, setUpsellInput] = useState("");
  const [crossSells, setCrossSells] = useState([]);
  const [crossSellInput, setCrossSellInput] = useState("");

  // Shipping, Tax & Policies State
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [shippingClass, setShippingClass] = useState("no-shipping-class");
  const [taxStatus, setTaxStatus] = useState("taxable");
  const [taxClass, setTaxClass] = useState("standard");

  // Policy Documents State
  const [policyDocuments, setPolicyDocuments] = useState([]);
  const policyFileInputRef = useRef(null);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "video" : "image",
        isNew: true,
      }));
      setMediaFiles((prev) => [...prev, ...newFiles]);
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
      }));
      setMediaFiles((prev) => [...prev, ...newFiles]);
    }
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
      { name: "", sku: "", price: "", stock: "", useMainPricing: true },
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

  // Linked Products Handlers
  const handleAddUpsell = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = upsellInput.trim();
      if (trimmed && !upsells.includes(trimmed)) {
        setUpsells([...upsells, trimmed]);
      }
      setUpsellInput("");
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
    }
  };

  const handleRemoveCrossSell = (itemToRemove) => {
    setCrossSells(crossSells.filter((item) => item !== itemToRemove));
  };

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
          setBrand(data.brand || "EmpowerHome Basics");
          setShortDescription(data.shortDescription || "");
          setDescription(data.description || "");
          setSku(data.sku || "");

          setRegularPrice(data.regularPrice?.toString() || "");
          setDiscountPrice(data.discountPrice?.toString() || "");
          setInitialStock(data.initialStock?.toString() || "");
          setSupportsWholesale(data.supportsWholesale || false);
          setWholesaleDiscountType(data.wholesaleDiscountType || "percentage");

          setWeight(data.weight?.toString() || "");
          setLength(data.length?.toString() || "");
          setWidth(data.width?.toString() || "");
          setHeight(data.height?.toString() || "");
          setShippingClass(data.shippingClass || "no-shipping-class");
          setTaxStatus(data.taxStatus || "taxable");
          setTaxClass(data.taxClass || "standard");

          if (data.attributes) setAttributes(data.attributes);
          if (data.variations) setVariations(data.variations);
          if (data.tags) setTags(data.tags.map((t) => t.name));

          if (data.media) {
            const existingMedia = data.media.map((m) => ({
              isNew: false,
              id: m.id,
              url: `${BACKEND_URL}/uploads/products/${m.fileName}`,
              type: m.fileType,
            }));
            setMediaFiles(existingMedia);
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
    if (!productName || !regularPrice) {
      setSubmitError("Product name and regular price are required.");
      return;
    }

    if (mediaFiles.length === 0) {
      setSubmitError("You must upload at least one media file.");
      return;
    }

    if (mediaFiles[0].type !== "image") {
      setSubmitError("The primary media must be an image.");
      return;
    }

    setSubmitError("");

    try {
      const productData = {
        name: productName,
        type: productType,
        category: category,
        brand: brand,
        shortDescription: shortDescription,
        description: description,
        regularPrice: parseFloat(regularPrice) || 0,
        discountPrice: parseFloat(discountPrice) || null,
        sku: sku,
        initialStock: parseInt(initialStock) || 0,
        supportsWholesale: supportsWholesale,
        wholesaleDiscountType: wholesaleDiscountType,
        weight: parseFloat(weight) || null,
        length: parseFloat(length) || null,
        width: parseFloat(width) || null,
        height: parseFloat(height) || null,
        shippingClass: shippingClass,
        taxStatus: taxStatus,
        taxClass: taxClass,
        status: "in", // Setting default status as 'in' stock

        attributes: attributes
          .filter((a) => a.name && a.value)
          .map((a) => ({ name: a.name, value: a.value })),
        tags: tags.map((t) => ({ name: t })),
        variations: variations
          .filter((v) => v.name)
          .map((v) => ({
            name: v.name,
            sku: v.sku,
            price: parseFloat(v.price) || null,
            stock: parseInt(v.stock) || 0,
            useMainPricing: v.useMainPricing,
          })),
        linkedProducts: [
          ...upsells.map((u) => ({
            linkedType: "UPSELL",
            linkedProductName: u,
          })),
          ...crossSells.map((c) => ({
            linkedType: "CROSS_SELL",
            linkedProductName: c,
          })),
        ],
        media: mediaFiles.map((m, index) => ({
          id: m.isNew ? null : m.id,
          isNew: m.isNew,
          isPrimary: index === 0,
        })),
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

      policyDocuments.forEach((doc) => {
        if (doc.file) {
          formData.append("policyFiles", doc.file);
        }
      });

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
    validatePrices(val, discountPrice);
  };

  const handleDiscountPriceChange = (e) => {
    const val = e.target.value;
    setDiscountPrice(val);
    validatePrices(regularPrice, val);
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
          <button
            className="btn-back"
            onClick={handleCancel}
            title="Back to Products"
          >
            {/* <ArrowLeft size={20} /> <span>Back</span> */}
            Back
          </button>
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
              className="form-control"
              placeholder="e.g. Minimalist Oak Coffee Table"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Product Type</label>
            <select
              className="form-control"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
            >
              <option value="single">Single Product</option>
              <option value="grouped">Grouped Product</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group form-col">
              <label>Category</label>
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select Category</option>
                <option value="grocery">Grocery & Gourmet Food</option>
                <option value="health">Health & Household</option>
                <option value="home">Home & Kitchen</option>
                <option value="beauty">Beauty & Personal Care</option>
                <option value="clothing">Clothing, Shoes & Jewellery</option>
                <option value="toys">Toys & Games</option>
                <option value="patio">Patio, Lawn & Garden</option>
                <option value="musical">Musical Instruments</option>
              </select>
            </div>
            <div className="form-group form-col">
              <label>Brand</label>
              <input
                type="text"
                className="form-control"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label>Short Description</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Provide a brief overview of the product for search results..."
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            ></textarea>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Description</label>
            <textarea
              className="form-control"
              placeholder="Provide a detailed description of the product features and benefits..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
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
                className="form-control"
                placeholder="EHOME-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
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
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Minimum Order Quantity</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="10"
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Discount Type</label>
                <select
                  className="form-control"
                  value={wholesaleDiscountType}
                  onChange={(e) => setWholesaleDiscountType(e.target.value)}
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              {wholesaleDiscountType === "percentage" && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Discount Value</label>
                  <select className="form-control" defaultValue="5">
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
                  <video src={media.url} className="image-thumbnail" muted />
                ) : (
                  <img
                    src={media.url}
                    alt={`Preview ${index}`}
                    className="image-thumbnail"
                    draggable="false"
                  />
                )}
                {index === 0 && <div className="primary-label">Primary</div>}
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
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Solid Oak"
                    value={attr.value}
                    onChange={(e) =>
                      handleAttributeChange(index, "value", e.target.value)
                    }
                  />
                </div>
                <div style={{ paddingTop: index === 0 ? "24px" : "0" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      padding: "0.75rem",
                      borderColor: "#ffdddd",
                      color: "#FF5722",
                      backgroundColor: "#FFF0EB",
                    }}
                    onClick={() => handleRemoveAttribute(index)}
                    disabled={attributes.length === 1}
                  >
                    &times;
                  </button>
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
                <select className="form-control">
                  <option value="us">United States</option>
                  <option value="cn">China</option>
                  <option value="in">India</option>
                  <option value="uk">United Kingdom</option>
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
              <input
                type="text"
                className="form-control"
                placeholder="Press enter to add product name or ID..."
                value={upsellInput}
                onChange={(e) => setUpsellInput(e.target.value)}
                onKeyDown={handleAddUpsell}
              />
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
              <input
                type="text"
                className="form-control"
                placeholder="Press enter to add product name or ID..."
                value={crossSellInput}
                onChange={(e) => setCrossSellInput(e.target.value)}
                onKeyDown={handleAddCrossSell}
              />
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
        </div>

        {/* Section 7: Shipping, Tax & Policies */}
        <div className="form-section">
          <div className="section-header">
            <div className="step-indicator">7</div>
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
            <div className="form-group form-col" style={{ flex: 1 }}>
              <label>Shipping class</label>
              <select
                className="form-control"
                value={shippingClass}
                onChange={(e) => setShippingClass(e.target.value)}
              >
                <option value="no-shipping-class">No shipping class</option>
              </select>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: "0.5rem" }}>
            <div className="form-group form-col">
              <label>Tax status</label>
              <select
                className="form-control"
                value={taxStatus}
                onChange={(e) => setTaxStatus(e.target.value)}
              >
                <option value="taxable">Taxable</option>
                <option value="shipping">Shipping only</option>
                <option value="none">None</option>
              </select>
            </div>
            <div className="form-group form-col">
              <label>Tax class</label>
              <select
                className="form-control"
                value={taxClass}
                onChange={(e) => setTaxClass(e.target.value)}
              >
                <option value="standard">Standard</option>
                <option value="reduced-rate">Reduced rate</option>
                <option value="zero-rate">Zero rate</option>
              </select>
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
