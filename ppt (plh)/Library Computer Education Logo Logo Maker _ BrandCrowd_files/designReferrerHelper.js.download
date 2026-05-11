class DesignReferrerManager {
    designReferrerConstants = {
        SearchPage: 'Search',
        TagPage: 'Tag',
        CreateNewDesignPage: 'CreateNewDesign',
        MyLogosPage: 'MyLogos',
        LandingPage: 'Landing',
    };
    
    designReferrerWhitelist = [
        {
            referrer: this.designReferrerConstants.SearchPage,
            patterns: [/\/maker\/logos/, /[^\/]+-maker\/search/],
        },
        {
            referrer: this.designReferrerConstants.TagPage,
            patterns: [/\/maker\/tag\//, /\/.+maker\/tag\//],
        },
        {
            referrer: this.designReferrerConstants.CreateNewDesignPage,
            patterns: [/\/maker\/mydesigns\/logodrafts\/.{36}\/templatetypes/],
        },
        {
            referrer: this.designReferrerConstants.MyLogosPage,
            patterns: [/\/mylogos\/drafts\/.{36}/],
        },
        {
            referrer: this.designReferrerConstants.LandingPage,
            patterns: [/[^\/]+-maker(?!\/)/],
        },
    ];

    getQueryStringFromCurrentLocation = (queryStringKey) => {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get(queryStringKey);
    };
    
    getDesignReferrer() {
        const referrer = this.getQueryStringFromCurrentLocation(
            'utm_medium',
        );
        
        if (referrer) {
            return referrer;
        }
        
        if (document.referrer) {
            const referrerUrl = new URL(document.referrer);
            const match = this.designReferrerWhitelist.find((x) =>
                x.patterns.find((p) => p.test(referrerUrl.pathname)),
            );
            if (match) {
                return match.referrer;
            }
        }

        return null;
    }
}

if (!window.DesignReferrerManager) {
    window.DesignReferrerManager = new DesignReferrerManager();
}