import resizeSensor from 'vue-resize-sensor'

export default function(pdfjsWrapper) {

	var createLoadingTask = pdfjsWrapper.createLoadingTask;
	var PDFJSWrapper = pdfjsWrapper.PDFJSWrapper;

	return {
		createLoadingTask: createLoadingTask,
		render: function(h) {
			return h('span', {
				attrs: {
					style: 'display: block;'
				}
			}, [
				h('canvas', {
					attrs: {
						style: 'display: block; margin: auto;',
					},
					ref:'canvas'
				}),
				h('span', {
					style: 'display: inline-block; width: 100%; height: 100%',
					class: 'annotationLayer',
					ref:'annotationLayer'
				}),
				h(resizeSensor, {
					props: {
						initial: true
					},
					on: {
						resize: this.resize
					},
				})
			])
		},
		props: {
			src: {
				type: [String, Object, Uint8Array],
				default: '',
			},
			page: {
				type: Number,
				default: 1,
			},
			rotate: {
				type: Number,
			},
			zoom: {
				type: Number,
				default: 100,
			},
		},
		watch: {
			src: function() {
				this.pdf.loadDocument(this.src);
			},
			page: function() {
				this.pdf.loadPage(this.page, this.rotate);
			},
			rotate: function() {
				this.pdf.renderPage(this.rotate, this.zoom);
			},
			zoom: function() {
				this.pdf.renderPage(this.rotate, this.zoom);
			}
		},
		methods: {
			resize: function(size) {
				// check if the element is attached to the dom tree || resizeSensor being destroyed
				if ( this.$el.parentNode === null || (size.width === 0 && size.height === 0) )
					return;

				// on IE10- canvas height must be set
				// this.$refs.canvas.style.height = this.$refs.canvas.offsetWidth * (this.$refs.canvas.height / this.$refs.canvas.width) + 'px';
				// update the page when the resolution is too poor
					this.pdf.renderPage(this.rotate, this.zoom);

				// this.$refs.annotationLayer.style.transform = 'scale('+resolutionScale+')';
			},
			print: function(dpi, pageList) {

				this.pdf.printPage(dpi, pageList);
			}
		},

		// doc: mounted hook is not called during server-side rendering.
		mounted: function() {

			this.pdf = new PDFJSWrapper(this.$refs.canvas, this.$refs.annotationLayer, this.$emit.bind(this));

			this.$on('loaded', function() {

				this.pdf.loadPage(this.page, this.rotate);
			});

			this.$on('page-size', function(width, height) {

				// reset
				this.$refs.canvas.style.height = '100%';
				this.$refs.canvas.style.width = '100%';

				var canvasFactor = this.$refs.canvas.offsetWidth / this.$refs.canvas.offsetHeight;
				var pageFactor = width / height;
				
				var factor;
				if (canvasFactor > pageFactor) {
					factor = this.$refs.canvas.offsetHeight / height;
				} else {
					factor = this.$refs.canvas.offsetWidth / width;
				}
				factor *= (this.zoom || 100) / 100;

				this.$refs.canvas.style.height = height * factor + 'px';
				this.$refs.canvas.style.width = width * factor + 'px';
			});

			this.pdf.loadDocument(this.src);
		},

		// doc: destroyed hook is not called during server-side rendering.
		destroyed: function() {

			this.pdf.destroy();
		}
	}

}
