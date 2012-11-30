/*******************************************************************************
 * @license
 * Copyright (c) 2012 IBM Corporation and others.
 * All rights reserved. This program and the accompanying materials are made 
 * available under the terms of the Eclipse Public License v1.0 
 * (http://www.eclipse.org/legal/epl-v10.html), and the Eclipse Distribution 
 * License v1.0 (http://www.eclipse.org/org/documents/edl-v10.html). 
 * 
 ******************************************************************************/
/*global define document window*/
define(["require", "orion/Deferred", "orion/PageUtil", "orion/URITemplate"], function(require, Deferred, PageUtil, URITemplate) {

	function createLink(href, target, textContent) {
		var a = document.createElement("a");
		a.href = href;
		a.target = target;
		a.className = "targetSelector";
		a.textContent = textContent;
		return a;
	}

	/**
	 * Build links from <code>orion.page.*</code> service extensions.
	 * @param {orion.ServiceRegistry} serviceRegistry The service registry.
	 * @param {String} serviceName Service name to read extensions from.
	 * @return {Deferred} A promise that resolves to an Array of link elements.
	 */
	function createPageLinks(serviceRegistry, serviceName) {
		serviceName = serviceName || "orion.page.link"; //$NON-NLS-0$
		// Note that the shape of the "orion.page.link" extension is not in any shape or form that could be considered final.
		// We've included it to enable experimentation. Please provide feedback on IRC or bugzilla.
		
		// The shape of a contributed navigation link is (for now):
		// info - information about the navigation link (object).
		//     required attribute: name - the name of the navigation link
		//     required attribute: id - the id of the navigation link
		//     required attribute: uriTemplate - the URL for the navigation link
		//     optional attribute: image - a URL to an icon representing the link (currently not used, may use in future)
		var navLinks= serviceRegistry.getServiceReferences(serviceName); //$NON-NLS-0$
		var params = PageUtil.matchResourceParameters(window.location.href);
		// TODO: should not be necessary, see bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=373450
		var hostName = window.location.protocol + "//" + window.location.host; //$NON-NLS-0$
		var locationObject = {OrionHome: hostName, Location: params.resource};
		var target = "_self"; //$NON-NLS-0$
		var links = [];
		for (var i=0; i<navLinks.length; i++) {
			var info = {};
			var propertyNames = navLinks[i].getPropertyKeys();
			for (var j = 0; j < propertyNames.length; j++) {
				info[propertyNames[j]] = navLinks[i].getProperty(propertyNames[j]);
			}
			if(info.uriTemplate && info.nls && (info.name || info.nameKey)){
				var d = new Deferred();
				require(['i18n!'+info.nls], function(commandMessages){ //$NON-NLS-0$
					var uriTemplate = new URITemplate(info.uriTemplate);
					var expandedHref = window.decodeURIComponent(uriTemplate.expand(locationObject));
					expandedHref = PageUtil.validateURLScheme(expandedHref);
					d.resolve(createLink(expandedHref, target, (info.nameKey? commandMessages[info.nameKey]: info.name)));
				});
				links.push(d);
			} else if (info.uriTemplate && info.name) {
				var uriTemplate = new URITemplate(info.uriTemplate);
				var expandedHref = window.decodeURIComponent(uriTemplate.expand(locationObject));
				expandedHref = PageUtil.validateURLScheme(expandedHref);
				links.push(new Deferred.resolve(createLink(expandedHref, target, info.name)));
			}
		}
		return Deferred.all(links);
	}

	return {
		createPageLinks: createPageLinks
	};
});