class BFM
{
    public templateUrl = '../src/main/widgets/basicSearch/bfm.tpl.html';

    constructor() { }

    public static Factory()
    {
        var directive = () =>
        {
            return new BFM();
        };

        return directive;
    }
}

export = BFM;
