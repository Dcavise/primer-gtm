import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Mail, Phone, MapPin, Building, User, Users, Filter } from "lucide-react";
import { 
  HunterContact,
  HunterDomainResponse,
  EmailFinderResponse,
  searchContactsByDomain,
  findEmailByName
} from "@/lib/serverComms";
import { LoadingState } from "@/components/LoadingState";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';
type SearchMode = 'domain' | 'email';

export default function FindContactsPage() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [searchStatus, setSearchStatus] = useState<SearchStatus>('idle');
  const [searchMode, setSearchMode] = useState<SearchMode>('domain');
  const [contacts, setContacts] = useState<HunterContact[]>([]);
  const [foundEmail, setFoundEmail] = useState<EmailFinderResponse | null>(null);
  const [domainInfo, setDomainInfo] = useState<{
    domain: string;
    organization: string | null;
    location: string | null;
  } | null>(null);
  const [department, setDepartment] = useState<string>("");
  const [seniority, setSeniority] = useState<string>("");
  const [contactType, setContactType] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a domain name");
      return;
    }

    // Validate domain format
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (!domainRegex.test(searchQuery.trim())) {
      toast.error("Please enter a valid domain (e.g., example.com)");
      return;
    }

    setSearchStatus('loading');
    setError(null);
    setFoundEmail(null);

    try {
      if (searchMode === 'domain') {
        const result = await searchContactsByDomain({
          domain: searchQuery.trim(),
          department: department || undefined,
          seniority: seniority || undefined,
          type: (contactType as "personal" | "generic" | undefined) || undefined,
        });

        if (result) {
          setContacts(result.emails || []);
          
          // Format location
          const locationParts = [result.city, result.state, result.country]
            .filter(Boolean)
            .join(", ");
          
          setDomainInfo({
            domain: result.domain,
            organization: result.organization,
            location: locationParts || null
          });
          
          setSearchStatus('success');
        } else {
          setContacts([]);
          setDomainInfo(null);
          setSearchStatus('error');
          setError("No results found");
        }
      } else {
        // Email finder mode
        if (!firstName.trim() || !lastName.trim()) {
          toast.error("Please enter both first name and last name");
          setSearchStatus('idle');
          return;
        }

        const result = await findEmailByName({
          domain: searchQuery.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        });

        if (result && result.data) {
          setFoundEmail(result);
          setDomainInfo({
            domain: result.data.domain,
            organization: result.data.company,
            location: null
          });
          setSearchStatus('success');
        } else {
          setFoundEmail(null);
          setDomainInfo(null);
          setSearchStatus('error');
          setError("No email found for this person at this domain");
        }
      }
    } catch (err) {
      console.error("Error searching:", err);
      setSearchStatus('error');
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast.error(searchMode === 'domain' ? "Failed to search contacts" : "Failed to find email");
    }
  };

  const renderConfidenceLabel = (confidence: number) => {
    if (confidence >= 90) return <Badge className="bg-green-500">High</Badge>;
    if (confidence >= 70) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge className="bg-red-500">Low</Badge>;
  };

  const toggleSearchMode = () => {
    // Reset form when toggling modes
    setSearchStatus('idle');
    setContacts([]);
    setFoundEmail(null);
    setDomainInfo(null);
    setError(null);
    setSearchMode(searchMode === 'domain' ? 'email' : 'domain');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-slate-700 to-slate-600 text-white py-8 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Find Contacts</h1>
          </div>
          <p className="text-white/80 mt-2">
            Search and find business contacts by domain name
          </p>
        </div>
      </header>

      <main className="container mx-auto p-4 max-w-5xl">
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Search Business Contacts</CardTitle>
                <CardDescription>
                  {searchMode === 'domain' 
                    ? "Find all contacts at a company domain" 
                    : "Find a specific person's email address"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Domain Search</span>
                <Switch 
                  checked={searchMode === 'email'} 
                  onCheckedChange={toggleSearchMode} 
                  id="search-mode"
                />
                <span className="text-sm text-muted-foreground">Email Finder</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {searchMode === 'domain' ? (
                <>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input
                      placeholder="Domain name (e.g., stripe.com)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleSearch} disabled={searchStatus === 'loading'}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Select value={department} onValueChange={setDepartment}>
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Any department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any department</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                          <SelectItem value="it">IT</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="management">Management</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="communication">Communication</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="seniority">Seniority</Label>
                      <Select value={seniority} onValueChange={setSeniority}>
                        <SelectTrigger id="seniority">
                          <SelectValue placeholder="Any seniority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any seniority</SelectItem>
                          <SelectItem value="junior">Junior</SelectItem>
                          <SelectItem value="senior">Senior</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="type">Contact Type</Label>
                      <Select value={contactType} onValueChange={setContactType}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Any type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any type</SelectItem>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="generic">Generic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-1">
                      <Label htmlFor="domain" className="mb-2 block">Domain</Label>
                      <Input
                        id="domain"
                        placeholder="Domain (e.g., stripe.com)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="firstName" className="mb-2 block">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="mb-2 block">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Button onClick={handleSearch} disabled={searchStatus === 'loading'} className="mt-2">
                      <Search className="h-4 w-4 mr-2" />
                      Find Email
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {searchStatus === 'loading' && (
          <LoadingState message={searchMode === 'domain' ? "Searching for contacts..." : "Finding email address..."} />
        )}

        {searchStatus === 'success' && searchMode === 'domain' && contacts.length > 0 && domainInfo && (
          <>
            <div className="mb-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-medium mb-2">{domainInfo.organization || domainInfo.domain}</h2>
                      <p className="text-muted-foreground flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {domainInfo.domain}
                      </p>
                      {domainInfo.location && (
                        <p className="text-muted-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {domainInfo.location}
                        </p>
                      )}
                    </div>
                    <div>
                      <Badge className="bg-blue-500">{contacts.length} contacts found</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {contacts.map((contact) => (
                <Card key={contact.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 rounded-full p-3">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-lg">
                            {contact.first_name && contact.last_name 
                              ? `${contact.first_name} ${contact.last_name}` 
                              : contact.value}
                          </h3>
                          <div>
                            {renderConfidenceLabel(contact.confidence)}
                            {contact.type === "generic" && (
                              <Badge variant="outline" className="ml-2">Generic</Badge>
                            )}
                          </div>
                        </div>
                        
                        {contact.position && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="h-4 w-4 mr-2" />
                            <span>{contact.position}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-blue-500" />
                          <a href={`mailto:${contact.value}`} className="text-blue-500 hover:underline">{contact.value}</a>
                        </div>
                        
                        {contact.phone_number && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{contact.phone_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  {contact.sources && contact.sources.length > 0 && (
                    <CardFooter className="pt-0 border-t px-6 py-3">
                      <div className="w-full text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Users className="h-3 w-3 mr-1" />
                          Found on {contact.sources.length} {contact.sources.length === 1 ? 'source' : 'sources'}
                        </span>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}

        {searchStatus === 'success' && searchMode === 'email' && foundEmail && foundEmail.data && domainInfo && (
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between mb-6">
                <div>
                  <h2 className="text-xl font-medium mb-2">{domainInfo.organization || domainInfo.domain}</h2>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    {domainInfo.domain}
                  </p>
                </div>
                <div>
                  <Badge className={`${foundEmail.data.score >= 90 ? 'bg-green-500' : foundEmail.data.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    Score: {foundEmail.data.score}%
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 space-y-3">
                  <h3 className="font-medium text-lg">
                    {foundEmail.data.first_name} {foundEmail.data.last_name}
                  </h3>
                  
                  {foundEmail.data.position && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{foundEmail.data.position}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm font-medium">
                    <Mail className="h-4 w-4 mr-2 text-blue-500" />
                    <a href={`mailto:${foundEmail.data.email}`} className="text-blue-500 hover:underline">
                      {foundEmail.data.email}
                    </a>
                  </div>
                  
                  {foundEmail.data.phone_number && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 mr-2" />
                      <span>{foundEmail.data.phone_number}</span>
                    </div>
                  )}
                  
                  {foundEmail.data.verification && (
                    <div className="flex items-center text-sm text-muted-foreground mt-2">
                      <Badge variant="outline">
                        Email {foundEmail.data.verification.status === 'valid' 
                          ? 'Verified' 
                          : foundEmail.data.verification.status === 'accept_all' 
                            ? 'Accept All Domain' 
                            : 'Unverified'}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            {foundEmail.data.sources && foundEmail.data.sources.length > 0 && (
              <CardFooter className="pt-0 border-t px-6 py-3">
                <div className="w-full text-xs text-muted-foreground">
                  <span className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    Found on {foundEmail.data.sources.length} {foundEmail.data.sources.length === 1 ? 'source' : 'sources'}
                  </span>
                </div>
              </CardFooter>
            )}
          </Card>
        )}

        {searchStatus === 'success' && searchMode === 'domain' && contacts.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No contacts found</h3>
              <p className="text-muted-foreground">
                We couldn't find any contacts for the domain "{searchQuery}". Try another domain or refine your search filters.
              </p>
            </CardContent>
          </Card>
        )}

        {searchStatus === 'success' && searchMode === 'email' && !foundEmail && (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Email not found</h3>
              <p className="text-muted-foreground">
                We couldn't find an email address for {firstName} {lastName} at {searchQuery}.
              </p>
            </CardContent>
          </Card>
        )}

        {searchStatus === 'error' && (
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Error searching contacts</h3>
              <p className="text-muted-foreground">
                {error || "An error occurred while searching for contacts. Please try again."}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
