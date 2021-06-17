var mSigObj;

Module.onRuntimeInitialized = _ => {		
    mSigObj = new Module.SigObj();
	try {
		mSigObj.setLicence("eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJMTVMiLCJleHAiOjE2NTA1MzY5NDcsImlhdCI6MTYxOTAwMTIxMSwicmlnaHRzIjpbIlNJR19TREtfQ09SRSJdLCJkZXZpY2VzIjpbIldBQ09NX0FOWSJdLCJ0eXBlIjoiZXZhbCIsImxpY19uYW1lIjoiVGVzdCBsaWNlbnNlIFsxNjE5MDAwOTQ3XSIsIndhY29tX2lkIjoiMTUzYmU4OWYtOTYzNy00YWI0LTk5OTktOTRlMGM4ZTBkMmEzIiwibGljX3VpZCI6ImQ3Zjk0ZmIwLTIxNzYtNDUwMC05YWIzLWQxYWUwZGQ4ZjNkZSIsImFwcHNfd2luZG93cyI6W10sImFwcHNfaW9zIjpbXSwiYXBwc19hbmRyb2lkIjpbXSwibWFjaGluZV9pZHMiOlsiMDA1MDU2QzAwMDAxIiwiMDA1MDU2QzAwMDA4Il19.fgprla5sZ7KAkUdTv6RYfcLNjbLoEsV4FYBdoW0cj1OkMCe7Wy3ghx53VQRE5b-eDQyz2pUK147dQ_4qsocJ3reaoUywuRgbYArUtcyD0krBULWunj8YVNU2CwJa3xW7rndu-plBLkC1neTYh7OKgeWrjc5mi0MFPJBU-q7oi3qLPko0yjkiHL8n4fm9m6Ap_s4ORQUbm1hrDnScGkXWWU2rf0wu12xXUku3rSUGo08xUbpH3KFRxNR3M1hP6Vt-EunD24IhHQrJcrxe4KNK2j3nlKvolM0tNvSoCw6j4Clh43zuqk9Mwo5XumBanOvB2lFJcVe_Ted95uqpfB8FXg");
	} catch (e) {
		alert(e);
	}
}

async function loadFromFile() {
	if (!mSigObj) {
		alert("Signature SDK not loaded yet");
		return;
	}
	
	const file = document.getElementById("myfile").files[0];
	if (file) {
	  // check the type	  
	  if ("text/plain" == file.type) {
		  // read the file as string
		  const reader = new FileReader();
          reader.onload = async function() {
            const data = reader.result;
			try {
				if (await mSigObj.setTextData(data)) {
					renderSignature();
				} else {
					alert("Incorrect signature data found");
				}
			} catch (e) {
				alert("Error loading signature as text "+e);
			}
		  }
          reader.readAsText(file);		
	  } else if ((file.type == "image/png") ||
                (file.type == "image/jpeg")) {			  
		const reader = new FileReader();
        reader.onload = async function() {
          const data = reader.result;
		  var img = new Image();	     
		  img.addEventListener('load', async function() {
             //the image has been loaded
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, img.width, img.height);
			const imageData = ctx.getImageData(0, 0, img.width, img.height);
			try {
				await mSigObj.readEncodedBitmapBinary(imageData.data, imageData.width, imageData.height);
				renderSignature();
			} catch (e) {
				alert("Error loading image "+e);
			}			
          }, false);
		  img.src = data;  
        }
        reader.readAsDataURL(file);		
	  } else {
		  // we assume is binary data
		  const reader = new FileReader();
          reader.onload = async function() {
            const data = reader.result;
			try {
				if (await mSigObj.setSigData(new Uint8Array(data))) {
					renderSignature(true);
				} else {
					alert("Incorrect signature data found");
				}
			} catch (e) {
				alert("Error loading signature as binary "+e);
			}
		  }
          reader.readAsArrayBuffer(file);		
	  }
	}
}
	
async function renderSignature(defaultSize) {
	//pixels = dpi*mm/25.4mm
	let width = Math.trunc((96*mSigObj.getWidth()*0.01)/25.4);     //  change 25.4 to 50
	let height = Math.trunc((96*mSigObj.getHeight()*0.01)/25.4);   //  change 25.4 to 50
	
	let scaleWidth = 300/width;
	let scaleHeight = 200/height;
	let scale = Math.min(scaleWidth, scaleHeight);
	
    console.log ("scale = " + scale);
	scale = scale/2;
	console.log ("New scale = " + scale);

	const inkColor = "#0000ff";
	const renderWidth = width * scale;
	const renderHeight = height * scale;
	let inkColor2use = inkColor;
	
	const canvas = new OffscreenCanvas(renderWidth, renderHeight);
	let inkCanvas = await new InkCanvasRaster(canvas, canvas.width, canvas.height);
	await BrushPalette.configure(inkCanvas.canvas.ctx);
    	//  put code to set color for customer(blue) & officer (red) here
    	if (document.getElementById("officer").checked) { inkColor2use = "#ff0000"; };
	window.WILL = inkCanvas;
	WILL.setColor(Color.fromHex(inkColor2use));
	WILL.type = "raster";
	await WILL.setTool("pen");			
	
	let inkWidth = 0.7;    // 1.0 change to 0.7
	const image = await mSigObj.renderBitmap(inkCanvas, 
	                                         renderWidth, 
	   								         renderHeight, 
											 "image/png", inkWidth, inkColor2use, "#ffffff", 10, 10, 0x800|0x40000);
		// flags  0x800 retun bitmap asbinary data, 10000 background Transparent, 40000  Render RGB 256 image, 0x400000 Encode sig data in image
		// THE LAST ELSE mean the very first time some one sign and forget to pick either customer NOR officer 
		//  (nothing checked then put image in first signture box)						 
        	if (document.getElementById("customer").checked) {
			document.getElementById("sig_image").src = image;
		} else if (document.getElementById("officer").checked) {
			document.getElementById("sig_image2").src = image;
		} else {
			document.getElementById("sig_image").src = image;
		}	
	// *******************************************************
	let type;
	type = Module.TextFormat.BASE64;
	try {
		const data = await mSigObj.getTextData(type);
		document.getElementById("sigbase64").value = data;
		console.log("The signature data as text is:\n"+data);
	} catch (e) {
		console.log("Error ");
	}


	/* const base64txtha = await mSigObj.renderBitmap(inkCanvas,     this will give image in form of text (can be convert online Base64 to png image)
													renderWidth, 
		   											renderHeight, 
													"image/png", inkWidth, inkColor2use, "#ffffff", 10, 10, 0x1000|0x10000|0x40000|0x400000);

	document.getElementById("sigbase64").value = base64txtha;
    */
   	await BrushPalette.delete();
    await window.WILL.delete();		
	window.WILL = null;
}

function captureFromCanvas(sigObj) {
	let canvasCapture = new CanvasCapture(sigObj);
	canvasCapture.startCapture(800, 600);
}
