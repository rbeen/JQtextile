/***************************************
*
*	The textile conversion functions were originally based on the JavaScript Textile project created by ben@ben-daglish.net http://www.ben-daglish.net/textile.shtml
*
****************************************/

(function ($) {

	var methods = {
		init : function(options){},
		html : function(textile_string) {
			// From HTML to textile, to be completed
			return this.html(textile_string);
		},
		textile : function(textile_string) {

			var alignment_dictionary = {'>':'right','<':'left','=':'center','<>':'justify','~':'bottom','^':'top'};
			var in_blockqoute = 0;
			var in_blockqoute_quote = 0;
			var in_paragraph = 0;
			var line_end = "\n\n";
			var output_string = "";
			var url_aliases = [];

			//Close off any multiline constructs
			function close_multiline(is_closed){
				if(is_closed){
					in_blockqoute_quote = 0;
				}
				if(in_paragraph){
					output_string += "<\/p>" + line_end;
					in_paragraph = 0;
				}
				if(in_blockqoute && !in_blockqoute_quote){
					output_string += "<\/blockquote>" + line_end;
					in_blockqoute = 0;
				}
			}

			function set_attribute(a,v){
				return ' ' + a + '="' + v + '"';
			}

			//Add any attributes to the current tag
			function make_attributes(this_string) {

				var this_style = "";
				var this_attribute = "";

				//If the string is empty then return
				if(!this_string){
					return "";
				}

				//Has the language been specified for this tag?
				var this_language = /\[(\w\w)\]/.exec(this_string);
				if(this_language !== null) {
					this_attribute += set_attribute('lang', this_language[1]);
				}

				//Has a combined class and ID been specified?
				var class_id = /\((\S+)\)/.exec(this_string);
				if(class_id !== null) {
					this_string = this_string.replace(/\((\S+)\)/,"");
					this_attribute += class_id[1].replace(/#(.*)$/,' id="$1"').replace(/^(\S+)/,' class="$1"');
				}

				//Has the block alignment been specified?
				var block_alignment = /(<>|=|<|>)/.exec(this_string);
				if(block_alignment){
					this_style += "text-align:" + alignment_dictionary[block_alignment[1]] + ";";
				}
				
				//Have any style settings been specified
				var style_settings = /\{(\S+)\}/.exec(this_string);
				if(style_settings){
					this_style += style_settings[1];
					if(!style_settings[1].match(/;$/)){
						this_style += ";";
					}
				}

				//Has an left padding be specified?
				var left_padding = /(\(+)/.exec(this_string);
				if(left_padding){
					this_style += "padding-left:" + left_padding[1].length + "em;";
				}

				//Has any right padding been specified?
				var right_padding = /(\)+)/.exec(this_string);
				if(right_padding){
					this_style += "padding-right:" + right_padding[1].length + "em;";
				}

				//If there are style attributes specified then set them
				if(this_style) {
					this_attribute += set_attribute('style',this_style);
				}

				return this_attribute;

			}


			function set_tag(t,a,c) {
				return "<" + t + a + ">" + c + "</" + t + ">";
			}


			//Create the img tag
			function make_image(item,this_regex) {

				var this_image = this_regex.exec(item);

				if(this_image !== null) {
					
					//If the image has any attributes then set them
					var this_attribute = "";
					var image_attributes = /\((.*)\)$/.exec(this_image[1]);
					if(image_attributes !== null) {
						this_attribute = set_attribute('alt',image_attributes[1]) + set_attribute("title",image_attributes[1]);
						this_image[1] = this_image[1].replace(/\((.*)\)$/,"");
					}

					//If the image has any styles then set them
					var this_style="";
					if(this_image[1].match(/^[><]/)) {
						this_style = "float:"+((this_image[1].indexOf(">") === 0)?"right;":"left;");
						this_image[1] = this_image[1].replace(/^[><]/,"");
					}
					
					var left_padding = /(\(+)/.exec(this_image[1]);
					if(left_padding){
						this_style += "padding-left:" + left_padding[1].length + "em;";
					}

					var right_padding = /(\)+)/.exec(this_image[1]);
					if(right_padding){
						this_style += "padding-right:" + right_padding[1].length + "em;";
					}

					//Add the styles to the attributes
					if(this_style){
						this_attribute += set_attribute('style', this_style);
					}

					//Build the img tag
					var made_image = '<img src="' + this_image[1] + '"' + this_attribute + " />";

					//If this image has a url then set it
					if(this_image.length > 2) {
						made_image = set_tag('a',set_attribute('href',this_image[2]),made_image);
					}

					item = item.replace(this_regex,made_image);

				}

				return item;
			}

			function make_tag(this_string, this_regex, this_tag, spacer) {

				//Iterate through the string until all the tags are set
				var item ="";
				item = this_regex.exec(this_string);
				while(item) {

					//Set the attributes
					var these_attributes = make_attributes(item[1]);

					//Clean up the item
					item[1] = item[1].replace(/^[\[\{\(]\S+[\]\}\)]/g,"");
					item[1] = item[1].replace(/^[<>=()]+/,"");

					//Put it back together
					this_string = this_string.replace(this_regex, spacer + set_tag(this_tag, these_attributes, item[1]) );

					//Reset item
					item = this_regex.exec(this_string);

				}
				return this_string;
			}

			function set_contents(item){

				var entity_dictionary = {"'":"&#8217;"," - ":" &#8211; ","--":"&#8212;"," x ":" &#215; ","\\.\\.\\.":"&#8230;","\\(C\\)":"&#169;","\\(R\\)":"&#174;","\\(TM\\)":"&#8482;"};
				var tag_dictionary = {"b":"\\*\\*","i":"__","em":"_","strong":"\\*","cite":"\\?\\?","sup":"\\^","sub":"~","span":"\\%","code":"@","ins":"\\+","del":"-"};

				//For each entity in the entity dictionary replace
				var entity = "";
				for(entity in entity_dictionary) {
					if (entity_dictionary.hasOwnProperty(entity)) {
						item = item.replace(new RegExp(entity,"g"),entity_dictionary[entity]);
					}
				}

				//For each tag in the tag dictionary replace
				var tag = "";
				for(tag in tag_dictionary) {
					if (tag_dictionary.hasOwnProperty(tag)) {
						item = make_tag(item,RegExp("^" + tag_dictionary[tag] + "(.+?)" + tag_dictionary[tag]), tag, "");
						item = make_tag(item,RegExp(" " + tag_dictionary[tag] + "(.+?)" + tag_dictionary[tag]), tag, " ");
					}
				}

				//Set superscript
				item = item.replace(/\[(\d+)\]/g,'<sup><a href="#fn$1">$1<\/a><\/sup>');

				//Set acronyms
				item = item.replace(/([A-Z]+)\((.*?)\)/g,'<acronym title="$2">$1<\/acronym>');

				//Set anchors
				item = item.replace(/\"([^\"]+)\":((http|https|mailto):\S+)/g,'<a href="$2">$1<\/a>');

				//Set images with links
				item = make_image(item,/!([^!\s]+)!:(\S+)/);

				//Set plain images
				item = make_image(item,/!([^!\s]+)!/);

				//Set url aliases
				item = item.replace(/"([^\"]+)":(\S+)/g,function($0,$1,$2){
					return set_tag("a",set_attribute('href',url_aliases[$2]),$1);
				});

				//Set the double quotes
				item = item.replace(/(=)?"([^\"]+)"/g,function($0,$1,$2){
					return ($1)?$0:"&#8220;"+$2+"&#8221;";
				});

				return item;
			}


			//Main
			function convert(this_string) {
				var block_quotes = /^bq\.(\.)?\s*/;
				var footnote = /^fn(\d+)\.\s*(.*)/;
				var in_table = 0;
				var list_end = "";
				var list_level = 0;
				var list_start = "";
				var para_regex = /^p(\S*)\.\s*(.*)/;
				var table_regex = /^table\s*\{(.*)\}\..*/;
				var table_row_style = /^\{(\S+)\}\.\s*\|/;

				//Convert the textile string into an array of lines.
				var lines = this_string.split(/\r?\n/);
				//For each line in the textile string, check to see if it is a URL alias.
				//If is then push it into the aliases array.
				//Giving it the label as the key
				//Trimming off the alias label
				for(var i=0;i<lines.length;i++) {
					if(lines[i].indexOf("[") === 0) {
						var this_label_end = lines[i].indexOf("]");
						var this_label = lines[i].substring(1, this_label_end);
						var this_url = lines[i].substring(this_label_end + 1);
						url_aliases[this_label] = this_url;
					}
				}

				//For each line in the textile string...
				for(i=0;i<lines.length;i++) {

					var this_item = "";

					//If there is a [ at index 0 then skip this loop because it assumed to be a URL alias.
					if (lines[i].indexOf("[") === 0){
						continue;
					}

					//If the line contains a block attribute then tag it and continue
					this_item = para_regex.exec(lines[i]);
					if(this_item){
						close_multiline(1);
						in_paragraph = 1;
						output_string += lines[i].replace(para_regex, "<p" + make_attributes(this_item[1]) + ">" + set_contents(this_item[2]));
						continue;
					}

					//If this line contains a heading then tag it and continue
					this_item = /^h(\d)(\S*)\.\s*(.*)/.exec(lines[i]);
					if(this_item){
						close_multiline(1);
						output_string += set_tag("h" + this_item[1], make_attributes(this_item[2]), set_contents(this_item[3]) ) + line_end;
						continue;
					}

					//Footnotes
					this_item = footnote.exec(lines[i]);
					if(this_item){
						close_multiline(1);
						in_paragraph = 1;
						output_string += lines[i].replace(footnote,'<p id="fn' + this_item[1] + '"><sup>' + this_item[1] + '<\/sup>' + set_contents(this_item[2]));
						continue;
					}

					//Set the lists
					if (lines[i].indexOf("*") === 0) {
						list_start="<ul>";
						list_end="<\/ul>";
					}else if (lines[i].indexOf("#") === 0) {
						list_start="<ol>";
						list_end="<\/ol>";
					}else {
						while (list_level > 0) {
							output_string += list_end;
							if(list_level > 1){
								output_string += "<\/li>";
							}else{
								output_string+="\n";
							}
							output_string += "\n";
							list_level--;

						}
						list_start="";
					}

					//Nest the lists
					if(list_start) {
						close_multiline(1);
						var item = /^([*#]+)\s*(.*)/.exec(lines[i]);
						var this_level = item[1].length;
						while(this_level < list_level) {
							output_string += list_end + "<\/li>\n";
							list_level--;
						}
						while(list_level < this_level) {
							output_string = output_string.replace(/<\/li>\n$/,"\n");
							output_string += list_start;
							list_level++;
						}
						output_string += set_tag("li","",set_contents(item[2]))+"\n";
						continue;
					}

					//Set the tables
					if (lines[i].match(table_regex)){
						close_multiline(1);
						in_table=1;
						output_string += lines[i].replace(table_regex,'<table style="$1;">\n');
						continue;
					}

					//Table rows
					if ((lines[i].indexOf("|") === 0) || (lines[i].match(table_row_style)) ) {

						close_multiline(1);

						if(!in_table) {
							output_string += "<table>\n";
							in_table=1;
						}

						var this_row_style = "";
						var table_row = "";

						//Set the row style
						var row_style = table_row_style.exec(lines[i]);
						if(row_style){
							this_row_style = set_attribute('style',row_style[1]);
							lines[i] = lines[i].replace(table_row_style,"|");
						}

						//For each cell in the row
						var table_cells = lines[i].split("|");

						for( var j = 1; j < table_cells.length-1; j++ ) {

							var table_tag = "td";
							
							//If this is the heading then swap to the heading tag
							if(table_cells[j].indexOf("_.") === 0) {
								table_tag = "th";
								table_cells[j] = table_cells[j].substring(2);
							}

							table_cells[j] = set_contents(table_cells[j]);

							var attribute_list = /\^([<>=\^~\/\\\{]+.*?)\.(.*)/.exec(table_cells[j]);

							var cell_attributes = "";
							var this_style = "";

							if(attribute_list !== null) {

								table_cells[j] = attribute_list[2];

								//Set the cell style
								var col_span = /\\(\d+)/.exec(attribute_list[1]);
								if(col_span !== null){
									cell_attributes += set_attribute('colspan',col_span[1]);
								}

								//Set the rowspan
								var row_span = /\/(\d+)/.exec(attribute_list[1]);
								if(row_span !== null){
									cell_attributes += set_attribute('rowspan',row_span[1]);
								}

								//Set the vertical alignment
								var vertical_align = /([\^~])/.exec(attribute_list[1]);
								if(vertical_align !== null){
									this_style += "vertical-align:" + alignment_dictionary[vertical_align[1]] + ";";
								}

								//Set the text alignment
								var text_align = /(<>|=|<|>)/.exec(attribute_list[1]);
								if(text_align !== null){
									this_style += "text-align:" + alignment_dictionary[text_align[1]] + ";";
								}

								//Set any block attributes
								var block_attributes = /\{([^\}]+)\}/.exec(attribute_list[1]);
								if(block_attributes !== null){
									this_style += block_attributes[1];
								}

								//Add any set style attributes
								if(this_style !== ""){
									cell_attributes += set_attribute('style',this_style);
								}
											
							}

							//Build the row
							table_row += set_tag(table_tag,cell_attributes,table_cells[j]);

						}

						output_string += "\t" + set_tag("tr", this_row_style, table_row) + "\n";

						continue;

					}

					//Close any outstanding tables
					if(in_table) {
						output_string += "<\/table>" + line_end;
						in_table = 0;
					}

					//If its an empty line then close any open multiline constructs
					if (lines[i] === "") {
						close_multiline();
					}else if (!in_paragraph) {
						this_item = block_quotes.exec(lines[i]);
						if(this_item){
							lines[i] = lines[i].replace(block_quotes,"");
							output_string += "<blockquote>";
							in_blockqoute = 1;
							if(this_item[1]) {
								in_blockqoute_quote = 1;
							}
						}
						output_string += "<p>" + set_contents(lines[i]);
						in_paragraph = 1;
					} else {
						output_string += '<br>' + set_contents(lines[i]);
					}
				}

				//Tidy up any open multiline constructs
				close_multiline();

				return output_string;

			}
			
			return this.html(convert(textile_string));
	
	    }
	};

	$.fn.JQtextile = function(method) {
		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.JQtextile' );
		}  
	};
		
})(jQuery);