/**
 * Async search-results.js v 0.2
 * @Author Martin Kravec <martin.kravec@mzk.cz>
 */
jQuery( document ).ready( function( $ ) {
	
	ADVSEARCH = {
			
		/**
		 * Update form's DOM state for groups.
		 * 
		 * This function updates numbers in form's DOM to ensure, that jQuery
		 * will correctly handle showing or hiding some elements in form.
		 * 
		 * @param	{string}		formSelector
		 * @return	{undefined}
		 */
		updateGroupsDOMState: function( formSelector ) {
			var groupsCount = $( formSelector ).find( '.group' ).length;
			if ( groupsCount == 1 ) {
				$( '.remove-advanced-search-group' ).parent().hide( 'blind', {}, 200);
				$( '#group-join-type-row' ).hide( 'blind', {}, 200);
			} else {
				$( '.remove-advanced-search-group' ).parent().show( 'blind', {}, 200);
				$( '#group-join-type-row' ).show( 'blind', {}, 200);
			}
		},

		/**
		 * Update form's DOM state for queries.
		 * 
		 * This function updates numbers in form's DOM to ensure, that jQuery
		 * will correctly handle showing or hiding some elements in form.
		 * 
		 * @param	{string}		groupSelector
		 * @return	{undefined}
		 */
		updateQueriesDOMState: function( groupSelector ) {
			var queriesCount = $( groupSelector + ' .queries').length;
			if ( queriesCount == 1 ) {
				$( groupSelector ).find( '.remove-advanced-search-query' ).parent().hide( 'blind', {}, 200);
			} else {
				$( groupSelector ).find( '.remove-advanced-search-query' ).parent().show( 'blind', {}, 200);
			}
		},
		
		/**
		 * Check checkboxes in institutions tree.
		 * 
		 * @param	{array}		filters
		 * @return	{undefined}
		 */
		checkCheckboxesInInstitutionsTree: function( filters ) {
			/* 
			 * FIXME: This function must take url instead of filters argument 
			 * from async function, in case of initial static page loading 
			 */
			
			$( '#side-panel-institution .institution-facet-filter' ).each( function ( index, element ) {
				var dataFacet = $( element ).attr( 'data-facet' );
				console.log('Comparing dataFacet: ');
				console.log(dataFacet);
				console.log('With applied filter: ');
				console.log(filter);
				if ( $.inArray( dataFacet, filters ) ) {
					$( element ).parent().click();
					console.log('Added');
				}
			});
		},
		
		/**
		 * Switch searchtype template
		 * 
		 * @param	{object}		data	Object with lookFor, bool, etc.
		 * @return	{undefined}
		 */
		switchSearchTemplate: function( data ) {
			$( '.search-panel' ).hide( 'blind', {}, 500, function() {
				
				if (data.searchTypeTemplate == 'advanced') {
					$( '.search-type-template-switch' ).text( VuFind.translate('Basic Search') );
					$( '.advanced-search-panel' ).removeClass('hidden');
					$( '.basic-search-panel' ).addClass('hidden');
				} else {
					$( '.search-type-template-switch' ).text( VuFind.translate('Advanced Search') );
					$( '.advanced-search-panel' ).addClass('hidden');
					$( '.basic-search-panel' ).removeClass('hidden');
				}
				
				ADVSEARCH.updateSearchTypeTemplates( data );
				
				$( '.search-panel' ).show( 'blind', {}, 500);
			});
		},

		/**
		 * This function gathers data from autocomplete|advancedSearch|windowHistory.
		 * The data are sent via ajax to Solr, which returns results.
		 * These results are displayed async via jQuery UI.
		 * 
		 * This function also handles live url changes with window.history.pushState,
		 * popState and replaceState.
		 * 
		 * @param {JSON} 	dataFromWindowHistory 
		 * @param {JSON} 	dataFromAutocomplete
		 * @param {string}	newSearchTypeTemplate		basic|advanced
		 * 
		 * @return {undefined}
		 */
		updateSearchResults: function( dataFromWindowHistory, dataFromAutocomplete, newSearchTypeTemplate ) {
			
			var data = {};
			var reloadResults = true;
			
			if ( dataFromWindowHistory !== undefined ) {
				/* 
				 * If moving in browser history, take data from window.history 
				 * instead of gather some form.
				 */
				data = dataFromWindowHistory;
				
			} else if ( dataFromAutocomplete ) {
				/* 
				 * If search started in autocomplete, gather data from autocomplete form 
				 */
				data = queryStringToJson( dataFromAutocomplete.queryString );
				if ( data.lookfor0 ) {
					var templookfor0 = data.lookfor0[0];
					data['lookfor0'] = [];
					data['lookfor0'].push( templookfor0 );
				}
				
				if ( data.type0 ) {
					var temptype0 = data.type0[0];
					data['type0'] = [];
					data['type0'].push( temptype0 );
				}
				
				if ( data.join[0] ) {
					data['join'] = data.join[0];
				}
				
				if ( data.keepEnabledFilters[0] ) {
					data['keepEnabledFilters'] = data.keepEnabledFilters[0];
				}
				
				if ( data.page[0] ) {
					data['page'] = data.page[0];
				}
				
				data['searchTypeTemplate'] = 'basic';
				
				console.log( 'Data fromautocomplete: ' );
				console.log( data );
				
			} else {
				/* If search started in advanced search, gather data from
				 * advances search form and hidden facetFilters 
				 */
				$( 'select.query-type, input.query-string, select.group-operator' ).each( function( index, element ) {
					var key = $( element ).attr( 'name' ).slice( 0, -2 );
					if (! data.hasOwnProperty( key )) {
						data[key] = [];
					}
					data[key].push( $( element ).val() );
				});
				
				var allGroupsOperator = $( 'input[name="join"]' ).val();
				data['join'] = allGroupsOperator;
				
				if (! data.hasOwnProperty( 'searchTypeTemplate' )) {
					var searchTypeTemplate = $( "input[name='searchTypeTemplate']" ).val();
					
					if (searchTypeTemplate) {
						data['searchTypeTemplate'] = searchTypeTemplate;
					} else {
						data['searchTypeTemplate'] = 'advanced';
					}	
				}

			}
			
			var filters = [];
			$( '.hidden-filter' ).each( function( index, element ) {
				filters.push( $( element ).val() );
			});
			data['filter'] = filters;
			
			if ( dataFromAutocomplete ) {
				var tempData = queryStringToJson( dataFromAutocomplete.queryString );
				if ( tempData.keepEnabledFilters == 'false' ) {
					data['filter'] = [];
				}
			}
			
			/* 
			 * Autocomplete form does not have all the data, that are 
			 * nessessary to perform search, thus this will set default ones.
			 */
			if ( dataFromWindowHistory == undefined) {
				
				if ( (! data.hasOwnProperty( 'bool0' )) || ( ! data.bool0 ) ) {
					data['bool0'] = [];
					data['bool0'].push( 'AND' );
				}
				
				if ( (! data.hasOwnProperty( 'join' ) ) || ( ! data.join ) ) {
					data['join'] = 'AND';
				}
				
				/* 
				 * Set search term and type from Autocomplete when provding 
				 * async results loading in basic search 
				 */
				if (! data.hasOwnProperty( 'lookfor0' )) {
					var lookfor0 = $( "input[name='last_searched_lookfor0']" ).val();
					data['lookfor0'] = [];
					data['lookfor0'].push( lookfor0 );
				}
				
				if (! data.hasOwnProperty( 'type0' )) {
					var type = $( "input[name='last_searched_type0']" ).val();
					data['type0'] = [];
					data['type0'].push( type );
				}
				
				if (! data.hasOwnProperty( 'limit' )) {
					var limit = $( "input[name='limit']" ).val();
					data['limit'] = limit;
				}
				
				if (! data.hasOwnProperty( 'sort' )) {
					var sort = $( "input[name='sort']" ).val();
					data['sort'] = sort;
				}
				
				if (! data.hasOwnProperty( 'page' )) {
					var page = $( "input[name='page']" ).val();
					data['page'] = page;
				}
			}
			
			/* Set last search */
			var lastSearchedLookFor0 = data['lookfor0'][0];
			$( "input[name='last_searched_lookfor0']" ).val( lastSearchedLookFor0 );

			var lastSearchedType0 = data['type0'][0];
			$( "input[name='last_searched_type0']" ).val( lastSearchedType0 );
			
			var searchTypeTemplate = data['searchTypeTemplate'];
			$( "input[name='searchTypeTemplate']" ).val( searchTypeTemplate );
			
			/* 
			 * If we want to just switch template between basic and advanced search,
			 * we need to again to gather data from forms 
			 * (becasue of future movement in browser history) and then switch 
			 * the templates.
			 */
			if ( newSearchTypeTemplate ) {

    			data['searchTypeTemplate'] = newSearchTypeTemplate;
    			
    			ADVSEARCH.switchSearchTemplate( data );
    			
    			reloadResults = false;
    		}
			
			/* 
			 * Live update url.
			 */
    		if ( dataFromWindowHistory == undefined ) {
    			ADVSEARCH.updateUrl( data );
    		} else { // from history
    			ADVSEARCH.replaceUrl( data );
    		}
    		
    		/*
    		 * Send current url (for link in full view Go back to search results)
    		 * */
			data['searchResultsUrl'] = window.location.href;
			
    		/*
    		 * Get search results from Solr and display them
    		 * 
    		 * There can be some situations where we do not want to reload 
    		 * search results. E.g. when we are just switching templates.
    		 *
    		 */
    		if (reloadResults) {
	    		/* Search */	
				$.ajax({
		        	type: 'POST',
		        	cache: false,
		        	dataType: 'json',
		        	url: VuFind.getPath() + '/AJAX/JSON?method=updateSearchResults',
		        	data: data,
		        	beforeSend: function() {
		        		
		        		scrollToTop();

		        		var loader = "<div id='search-results-loader' class='text-center'></div>";
		        		$( '#result-list-placeholder' ).hide( 'blind', {}, 200, function() {
		        			$( '#result-list-placeholder' ).before( loader );
		        		});
		        		$( '#results-amount-info-placeholder' ).html( "<i class='fa fa-2x fa-refresh fa-spin'></i>" );
		        		$( '#pagination-placeholder' ).hide( 'blind', {}, 200 );
		        		
		        		// Disable submit button until ajax finishes
		        		$( '#submit-edited-advanced-search', '.ajax-update-limit', '.ajax-update-sort' ).attr( 'disabled', true );
		        	},
		        	success: function( response ) {
		        		
		        		scrollToTop();
		        		
		        		if (response.status == 'OK') {
		        			
		        			if (data['filter'].length < 1) {
		        				/* Remove filters from containers when performing search without keeping enabled facets */
		        				$( '#hiddenFacetFilters' ).html( '' );
		        			}
		        			
		        			var responseData = response.data;
		        			var resultsHtml = JSON.parse(responseData.resultsHtml);
		        			var facetsHtml = JSON.parse(responseData.sideFacets);
		        			var resultsAmountInfoHtml = JSON.parse(responseData.resultsAmountInfoHtml);
		        			var paginationHtml = JSON.parse(responseData.paginationHtml);	
		        			
		        			/* Ux content replacement */
		        			$( '#search-results-loader' ).remove();
		        			$( '#result-list-placeholder, #pagination-placeholder' ).css( 'display', 'none' );
		        			$( '#result-list-placeholder' ).html( decodeHtml(resultsHtml.html) );
		        			$( '#pagination-placeholder' ).html( paginationHtml.html );
		        			$( '#results-amount-info-placeholder' ).html( resultsAmountInfoHtml.html );
		        			$( '#side-facets-placeholder' ).html( facetsHtml.html );
			        		$( '#result-list-placeholder, #pagination-placeholder, #results-amount-info-placeholder' ).show( 'blind', {}, 500 );
			        		
			        		/* Update search identificators */
			        		$( '#rss-link' ).attr( 'href', window.location.href + '&view=rss' );
			        		$( '.mail-record-link' ).attr( 'id', 'mailSearch' + responseData.searchId );
			        		$( '#add-to-saved-searches' ).attr( 'href', 'MyResearch/SaveSearch?save=' + responseData.searchId );
			        		$( '#remove-from-saved-searches' ).attr( 'href', 'MyResearch/SaveSearch?delete=' + responseData.searchId );
			        		
			        		/* Update lookfor inputs in both search type templates to be the same when switching templates*/
			        		ADVSEARCH.updateSearchTypeTemplates( data );
			        		
			        		/* If filters enabled, show checkbox in autocomplete */
			        		if ( data.filter.length > 0 ) {
			        			$( '#keep-facets-enabled-checkbox' ).show( 'blind', {}, 500 );
			        		} else {
			        			$( '#keep-facets-enabled-checkbox' ).hide( 'blind', {}, 200 );
			        		}
			        		
			        		console.log(' responseData.recordTotal: ');
		        			console.log( responseData.recordTotal );
		        			console.log(' Success happened ');
			        		
			        		/* Hide no results container when there is more than 0 results */
			        		if ( responseData.recordTotal > 0 ) {
			        			console.log(' responseData.recordTotal: ');
			        			console.log( responseData.recordTotal );
			        			console.log( 'Hide no resuls, show new results' );
			        			$( '#no-results-container' ).hide( 'blind', {}, 200, function(){
			        				$( this ).css( 'display', 'none' );
			        			} );
			        			$( '.result-list-toolbar, #limit, #sort_options_1, #bulk-action-buttons-placeholder, #search-results-controls' ).show( 'blind', {}, 500 );
			        		} else {
			        			console.log(' responseData.recordTotal: ');
			        			console.log( responseData.recordTotal );
			        			console.log( 'Show NO results' );
			        			$( '#no-results-container strong' ).text( data.lookfor0[0] );
			        			
			        			$( '#no-results-container' ).show( 'blind', {}, 500 );
			        			$( '.result-list-toolbar, #limit, #sort_options_1, #bulk-action-buttons-placeholder, #search-results-controls' ).hide( 'blind', {}, 200 );
			        		}
			        		
			        		/**/
			        		
		        		} else {
		        			console.error(response.data);
		        		}
		        		$( '#submit-edited-advanced-search', '.ajax-update-limit', '.ajax-update-sort' ).removeAttr( 'selected' );
		        		
		        		/* 
		        		 * Opdate sort and limit selects, when moving in history back or forward. 
		        		 * We need to use this f****** stupid robust solution to prevent 
		        		 * incompatibility and bad displaying of options that are 
		        		 * in real selected 
		        		 */
		        		$( '.ajax-update-limit option' ).prop( 'selected', false);
		        		$( '.ajax-update-limit' ).val( [] );
		        		$( '.ajax-update-limit option' ).removeAttr( 'selected' );
		        		
		        		$( '.ajax-update-sort option' ).prop( 'selected', false );
		        		$( '.ajax-update-sort' ).val( [] );
		        		$( '.ajax-update-sort option').removeAttr( 'selected');
		        		
		        		$( '.ajax-update-limit' ).val( data.limit );
		        		$( '.ajax-update-limit option[value=' + data.limit + ']' ).attr( 'selected', 'selected' );
		        		$( '.ajax-update-limit option[value=' + data.limit + ']' ).attr( 'selected', true );
		        		
		        		$( '.ajax-update-sort' ).val( data.sort );
	        			$( '.ajax-update-sort option[value="' + data.sort + '"]' ).attr( 'selected', 'selected' );
	        			$( '.ajax-update-sort option[value="' + data.sort + '"]' ).attr( 'selected', true );
		        		
		         	},
		            error: function ( xmlHttpRequest, status, error ) {
		            	$( '#search-results-loader' ).remove();
		            	console.error(xmlHttpRequest.responseText);
		            	console.log(xmlHttpRequest);
		            	console.error(status);
		            	console.error(error);
		            	console.log( 'Sent data: ' );
		            	console.log( data );
		            },
		            complete: function ( xmlHttpRequest, textStatus ) {
		            	if ( data.hasOwnProperty( 'filter' ) || data.filter ) {
		            		ADVSEARCH.checkCheckboxesInInstitutionsTree( data.filter );
		            	}
		            }
		        });
    		}
		},
			
		/**
		 * Add facet to container and update search results
		 * 
		 * @param 	{string}	value			institutions:"0/Brno/"
		 * @param 	{boolean}	updateResults	Wanna update results?
		 * @return	{undefined}
		 */
		addFacetFilter: function( value, updateResults ) {
			var enabledFacets = 0;
			$( '#hiddenFacetFilters input' ).each( function( index, element ) {
				if( $( element ).val() == value) {
					++enabledFacets;
					return false; // javascript equivalent to php's break;
				}
			});

			if ( enabledFacets == 0 ) { /* This filter not applied yet, apply it now */
				var html = "<input type='hidden' class='hidden-filter' name='filter[]' value='" + value + "'>";
				$( '#hiddenFacetFilters' ).append( html );
			}
			
			if ( updateResults ) {
				ADVSEARCH.updateSearchResults( undefined, undefined );
			}
		},
		
		/**
		 * Remove facet from container and update search results
		 * 
		 * @param 	{string}	value			institutions:"0/Brno/"
		 * @param 	{boolean}	updateResults	Wanna update results?
		 * @return	{undefined}
		 */
		removeFacetFilter: function( value, updateResults ) {
			$( '#hiddenFacetFilters input' ).each( function( index, element ) {
				if( $( element ).val() == value) {
					$( this ).remove();
				}
			});
			
			if ( updateResults ) {
				ADVSEARCH.updateSearchResults( undefined, undefined );
			}
		},
		
		/**
		 * Remove all filters
		 * 
		 * @param 	{boolean}	updateResults	Wanna update results?
		 * @return	{undefined}
		 */
		removeAllFilters: function( updateResults ) {
			$( '#hiddenFacetFilters input' ).remove();
			
			if ( updateResults ) {
				ADVSEARCH.updateSearchResults( undefined, undefined );
			}
		},
		
		/**
		 * Update URL with provided data via pushing state to window history
		 * 
		 * @param	{Object}	data	Object with lookFor, bool, etc.
		 * @return	{undefined}
		 */
		updateUrl: function( data ) {
			var stateObject = data;
			var title = 'New search query';
			var url = '/Search/Results/?' + jQuery.param( data )
			window.history.pushState( stateObject, title, url );
			//console.log( 'Pushing and replacing state: ' );
			//console.log( stateObject );
			window.history.replaceState( stateObject, title, url );
		},
		
		/**
		 * Update URL with provided data via replacing state in window history
		 * 
		 * @param	{Object}	data	Object with lookFor, bool, etc.
		 * @return	{undefined}
		 */
		replaceUrl: function( data ) {
			var stateObject = data;
			var title = 'New search query';
			var url = '/Search/Results/?' + jQuery.param( data )
			window.history.replaceState( stateObject, title, url );
			//console.log( 'Replacing state: ' );
			//console.log( stateObject );
		},
		
		/**
		 * Clear form in advanced search template
		 * 
		 * @return	{undefined}
		 */
		clearAdvancedSearchTemplate: function( ) {
			
			/*
			 * Remove redundand elements
			 */
			var d1 = $.Deferred();
			var d2 = $.Deferred();
			
			$.when(
				d1
			).then( function( x ) {
				ADVSEARCH.updateGroupsDOMState( '#editable-advanced-search-form' );
			});
			
			$.when(
				d2
			).then( function( x ) {
				ADVSEARCH.updateQueriesDOMState( '#group_0' );
			});
			
			d1.resolve(
				$( '#editable-advanced-search-form .group' ).each( function ( index, element ) {
					if ( $( element ).attr( 'id' ) != 'group_0' ) {
						$( element ).hide( 'blind', {}, 200, function() {
		        			$( element ).remove();
		        		});
					} 
				})
			);
			
			d2.resolve(
				$( '#group_0 .queries' ).each( function ( index, element ) {
					if ( $( element ).attr( 'id' ) != 'query_0' ) {
						$( element ).hide( 'blind', {}, 200, function() {
		        			$( element ).remove();
		        		});
					} 
				})
			);
			
			/* Previous callback does not work, so lets try to update it again after 300ms :/ */
			setTimeout(function() { 
				ADVSEARCH.updateGroupsDOMState( '#editable-advanced-search-form' );
			}, 300);
			
			/* 
			 * Empty first query and set default values to selects
			 */
			$( '#query_0 .query-string' ).val( '' );
			
			$( '#group_0 select.group-operator' ).selectedIndex = 0;
			$( '#group_0 select.query-type' ).selectedIndex = 0;

		},
		
		/**
		 * Update lookfor inputs in both search type templates to be the same when switching templates
		 * 
		 * @param	{Object}	data	Object with lookFor, bool, etc.
		 * @return	{undefined}
		 */
		updateSearchTypeTemplates: function( data ) {
			
			//console.log( 'Data: ' );
			//console.log( data );
			
			if ( (data.hasOwnProperty( 'lookfor1' ) ) || ( data.lookfor0.length > 1 )) {
				/* Search was made in advanced search */
				
				/* Fill autocomplete search form */
				//console.log( 'Filling autocomplete with' );
				//console.log( data.lookfor0[0] );
				$( '#searchForm_lookfor' ).val( data.lookfor0[0] );
			} else {
				/* Search was made in autocomplete */
				
				/* Fill adv. search form */
				ADVSEARCH.clearAdvancedSearchTemplate();
				//console.log( 'Clearing advanced search form' );
				
				//console.log( 'Filling advanced search form with ' );
				//console.log( data.lookfor0[0] );
				
				$( '#query_0 .query-string' ).val( data.lookfor0[0] );
				
				//console.log( 'Filling autocomplete with' );
				//console.log( data.lookfor0[0] );
				$( '#searchForm_lookfor' ).val( data.lookfor0[0] );
			}
		},
	}
	
	/**
	 * Load correct content on history back or forward
	 */
	$( window ).bind( 'popstate', function() {
		var currentState = history.state;
		//console.log( 'POPing state: ' );
		//console.log( currentState );
		if (currentState.searchTypeTemplate) {
			ADVSEARCH.updateSearchResults( currentState, undefined, currentState.searchTypeTemplate );
		} else {
			ADVSEARCH.updateSearchResults( currentState, undefined );
		}
	});
	
	/* Update form's DOM on page load 
	 * 
	 * This function updates numbers in form's DOM to ensure, that jQuery
	 * will correctly handle showing or hiding some elements in form.
	 */
	ADVSEARCH.updateGroupsDOMState( '#editable-advanced-search-form' );
	$( '#editable-advanced-search-form .group' ).each( function(){
		ADVSEARCH.updateQueriesDOMState( '#' + $( this ).attr( 'id' ) );
	});
	
	/*
	 * Add search group on click in advanced search template
	 */
	$( '#editable-advanced-search-form' ).on( 'click', '.add-search-group', function( event ) {
		event.preventDefault();
		var parentDiv = $( this ).parent().parent();
		var last = parentDiv.find( '.group' ).last();
		var clone = last.clone();
		var nextGroupNumber = parseInt( clone.attr( 'id' ).match( /\d+/ ) ) + 1;
		clone.attr( 'id', 'group_' + nextGroupNumber);
		clone.find( 'select' ).prop( 'selected', false );
		clone.find( 'select.group-operator' ).attr( 'name', 'bool' + nextGroupNumber + '[]' );
		clone.find( 'select.query-type' ).attr( 'name', 'type' + nextGroupNumber + '[]' );
		clone.find( '.queries:not(:first)').remove();
		clone.find( 'input:text' ).val( '' );
		clone.find( 'input:text' ).attr( 'name', 'lookfor' + nextGroupNumber + '[]' );
		clone.find( '.remove-advanced-search-query' ).addClass( 'hidden' );
		clone.css( 'display', 'none' )
		last.after( clone );
		clone.show( 'blind', {}, 400, function() {
			ADVSEARCH.updateGroupsDOMState( '#editable-advanced-search-form' );
		})
	});
	
	/*
	 * Add search query on click in advanced search template
	 */
	$( '#editable-advanced-search-form' ).on( 'click', '.add-search-query', function( event ) {
		event.preventDefault();
		var parentDiv = $( this ).parent().parent();
		var last = parentDiv.find( '.queries' ).last();
		var clone = last.clone();
		var nextQueryNumber = parseInt( clone.attr( 'id' ).match( /\d+/ ) ) + 1;
		var thisGroupElement = parentDiv.parent();
		var thisGroupNumber = parseInt( thisGroupElement.attr( 'id' ).match( /\d+/ ) );
		clone.attr( 'id', 'query_' + nextQueryNumber);
		clone.find( 'select' ).prop( 'selected', false );
		clone.find( 'select' ).attr( 'name', 'type' + thisGroupNumber + '[]' );
		clone.find( 'input:text' ).val( '' );
		clone.find( 'input:text' ).attr( 'name', 'lookfor' + thisGroupNumber + '[]' );
		clone.css( 'display', 'none' );
		last.after( clone );
		clone.show( 'blind', {}, 400, function() {
			var thisGroupSelector = $( this ).parent().parent().parent().parent();
			ADVSEARCH.updateQueriesDOMState( '#' + thisGroupElement.attr( 'id' ) );
			thisGroupElement.find( '.remove-advanced-search-query' ).removeClass( 'hidden' );
		});
	});
	
	/*
	 * Remove search group on click in advanced search template
	 */
	$( '#editable-advanced-search-form' ).on( 'click', '.remove-advanced-search-group', function( event ) {
		event.preventDefault();
		$( this ).parent().parent().hide( 'blind', {}, 400, function() {
			$( this ).remove();
			ADVSEARCH.updateGroupsDOMState( '#editable-advanced-search-form' );
		});
	});
	
	/*
	 * Remove search query on click in advanced search template
	 */
	$( '#editable-advanced-search-form' ).on( 'click', '.remove-advanced-search-query', function( event ) {
		event.preventDefault();
		var thisElement = $( this );
		var queryRow = thisElement.parent().parent();
		var thisGroupSelector = queryRow.parent().parent();
		queryRow.hide( 'blind', {},  400, function() {
			queryRow.remove();
			ADVSEARCH.updateQueriesDOMState( '#' + thisGroupSelector.attr( 'id' ) );
		});
	});
	
	/*
	 * Clear advanced search template
	 */
	$( '#editable-advanced-search-form' ).on( 'click', '#clearAdvancedSearchLink', function( event ) {
		event.preventDefault();
		ADVSEARCH.clearAdvancedSearchTemplate();
		
		// Clear also autocomplete
		$( '#searchForm_lookfor' ).val( '' );
	});
	
	/*
	 * Add or remove clicked facet
	 */
	$( 'body' ).on( 'click', '.facet-filter', function( event ) {
		event.preventDefault();
		
		$( "input[name='page']" ).val( '1' );
		
		if ( $( this ).hasClass( 'active' ) ) {
			console.log( 'Removing facet filter.' );
			ADVSEARCH.removeFacetFilter( $( this ).attr( 'data-facet' ), true );
		} else {
			console.log( 'Adding facet filter.' );
			ADVSEARCH.addFacetFilter( $( this ).attr( 'data-facet' ), true );
		}
	});
	
	/*
	 * Remove all institutions facets and add checked ones
	 */
	$( 'body' ).on( 'click', '.institution-facet-filter-button', function( event ) {
		event.preventDefault();
		
		$( "input[name='page']" ).val( '1' );

		//remove all institutions
		var allInstitutions = $('#facet_institution').jstree(true).get_json('#', {flat:true});
		$.each( allInstitutions, function( index, value ){
		  ADVSEARCH.removeFacetFilter( value['id'], false );
		});

		//add selected institutions
		var selectedInstitutions = $('#facet_institution').jstree(true).get_bottom_selected();
		$.each( selectedInstitutions, function( index, value ){
		  ADVSEARCH.addFacetFilter( value, false );
		});
		ADVSEARCH.updateSearchResults( undefined, undefined );
	});
	
	/*
	 * Add or remove clicked facet
	 */
	$( 'body' ).on( 'click', '#remove-all-filters-async', function( event ) {
		event.preventDefault();
		
		ADVSEARCH.removeAllFilters( true );
	});
	
	/*
	 * Update search results on paginating
	 */
	$( 'body' ).on( 'click', '.ajax-update-page', function( event ) {
		event.preventDefault();
		var page = $( this ).attr( 'href' );
		$( "input[name='page']" ).val( page );
		ADVSEARCH.updateSearchResults( undefined, undefined );
	});
	
	/*
	 * Update search results on changing sorting
	 */
	$( 'body' ).on( 'change', '.ajax-update-sort', function( event ) {
		event.preventDefault();
		var sort = $( this ).val();
		$( "input[name='sort']" ).val( sort );
		$( "input[name='page']" ).val( '1' );
		ADVSEARCH.updateSearchResults( undefined, undefined );
	});
	
	/*
	 * Update search results on changing limit
	 */
	$( 'body' ).on( 'change', '.ajax-update-limit', function( event ) {
		event.preventDefault();
		var limit = $( this ).val();
		$( "input[name='limit']" ).val( limit );
		$( "input[name='page']" ).val( '1' );
		ADVSEARCH.updateSearchResults( undefined, undefined );
	});
	
	/*
	 * Update search results on submiting advanced search form
	 */
	$( '#editable-advanced-search-form' ).on( 'click', '#submit-edited-advanced-search', function( event ) {
		event.preventDefault();

		//add chosen filters
		$(".chosen-select").each(function() {
			var selectedFilters = $( this ).val();
			if(selectedFilters!=null) {
				$.each(selectedFilters, function (index, value) {
					ADVSEARCH.addFacetFilter(value, false);
				});
			}
		});

		$( "input[name='page']" ).val( '1' );
		ADVSEARCH.updateSearchResults( undefined, undefined );
	});
	
	/*
	 * Switch search type template to basic search (autocomplete) or advanced search
	 */
	$( 'body' ).on( 'click', '.search-type-template-switch', function( event ) {
		event.preventDefault();
		
		var currentUrl = window.location.href;
		var searchTypeTemplate = getParameterByName( 'searchTypeTemplate', currentUrl );
		
		var newSearchTypeTemplate = 'basic';
		
		if (searchTypeTemplate == 'basic') {
			newSearchTypeTemplate = 'advanced';
		}
		
		ADVSEARCH.updateSearchResults( undefined, undefined, newSearchTypeTemplate );
	});

	/**
	 * Get param from url
	 * 
	 * This function doesn't handle parameters that aren't followed by equals sign
	 * This function also doesn't handle multi-valued keys
	 * 
	 * @param	{string}	name	Param name
	 * @param	{string}	url		Url
	 * 
	 * @return	{string}
	 */
	var getParameterByName = function( name, url ) {
	    var url = url.toLowerCase(); // avoid case sensitiveness  
	    var name = name.replace( /[\[\]]/g, "\\$&" ).toLowerCase(); // avoid case sensitiveness
	    
	    var regex = new RegExp( "[?&]" + name + "(=([^&#]*)|&|#|$)" ),
	        results = regex.exec( url );
	    
	    if ( ! results ) return null;
	    if ( ! results[2] ) return '';
	    
	    return decodeURIComponent( results[2].replace( /\+/g, " " ) );
	};
	
	/**
	 * Smooth scroll to the top of the element
	 * 
	 * @param	{string}	elementId
	 * @return	{undefined}
	 */
	var smoothScrollToElement = function( elementId ) {
		$( 'body' ).animate( {
	        scrollTop: $( elementId ).offset().top
	    }, 1000);
	};
	
	/**
	 * Scroll to the top of the document
	 * 
	 * @return	{undefined}
	 */
	var scrollToTop = function( elementId ) {
		$( 'html, body' ).animate( { scrollTop: 0 }, 'slow' );
	};
	
	
	/**
  	 * Returns JSON from query string
  	 * Function supports multi-valued keys
  	 * 
  	 * @param	{string}	queryString	?param=value&param2=value2
  	 * @return	{JSON}
  	 */
  	var queryStringToJson = function ( queryString ) {            
  	    var pairs = queryString.slice( 1 ).split( '&' );
  	    
  	    var results = {};
  	    pairs.forEach( function( pair ) {
  	        var pair = pair.split('=');
  	        var key = pair[0];
  	        var value = decodeURIComponent(pair[1] || '');
  	        
  	        if (! results.hasOwnProperty( key )) {
  	        	results[key] = [];
  			}
  	        results[key].push( value );
  	    });

  	    return JSON.parse( JSON.stringify( results ) );
  	};
  	
  	/**
  	 * Convert html entities to chars 
  	 * 
  	 * @param	{string}	html
  	 * @return	{string}
  	 */
  	var decodeHtml = function( html ) {
  	    var txt = document.createElement( 'textarea' );
  	    txt.innerHTML = html;
  	    return txt.value;
  	}
});